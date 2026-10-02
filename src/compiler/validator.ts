import { DiagnosticWarning } from './types';

export interface ValidationResult {
  hasErrors: boolean;
  errors: DiagnosticWarning[];
  warnings: DiagnosticWarning[];
}

export function validateCppCode(sourceCode: string): ValidationResult {
  const errors: DiagnosticWarning[] = [];
  const warnings: DiagnosticWarning[] = [];

  const rawLines = sourceCode.split('\n');
  const lines = rawLines.map(l => l.trim());

  // 1. Check for entry point: int main()
  const hasMain = lines.some(l => 
    /\b(int|void)\s+main\s*\([^)]*\)/.test(l)
  );

  if (!hasMain) {
    errors.push({
      type: 'UNDEFINED_REFERENCE',
      severity: 'error',
      title: "fatal error: undefined reference to 'main'",
      message: "In function '_start': undefined reference to 'main'. Every executable C/C++ program must define a primary entry point function: 'int main()'.",
      line: 1,
      remediation: "Add an 'int main() { ... return 0; }' function definition.",
      isFatal: true
    });
  }

  // 2. Bracket and Parentheses Balance Check
  const braceStack: { char: string; line: number; col: number }[] = [];
  let inBlockComment = false;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const lineNum = idx + 1;
    const rawLine = rawLines[idx];
    let inString: string | null = null;

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const c = rawLine[charIdx];
      const nextC = rawLine[charIdx + 1];
      const colNum = charIdx + 1;

      // Handle block comments /* ... */
      if (!inString && !inBlockComment && c === '/' && nextC === '*') {
        inBlockComment = true;
        charIdx++;
        continue;
      }
      if (inBlockComment && c === '*' && nextC === '/') {
        inBlockComment = false;
        charIdx++;
        continue;
      }
      if (inBlockComment) continue;

      // Ignore single line comments // ...
      if (!inString && c === '/' && nextC === '/') {
        break;
      }

      // Ignore characters inside string and char literals
      if ((c === '"' || c === "'") && rawLine[charIdx - 1] !== '\\') {
        if (!inString) {
          inString = c;
        } else if (inString === c) {
          inString = null;
        }
        continue;
      }
      if (inString) continue;

      if (c === '{' || c === '(') {
        braceStack.push({ char: c, line: lineNum, col: colNum });
      } else if (c === '}') {
        if (braceStack.length === 0 || braceStack[braceStack.length - 1].char !== '{') {
          errors.push({
            type: 'SYNTAX_ERROR',
            severity: 'error',
            title: "error: unexpected '}' token",
            message: `Unmatched closing brace '}' on line ${lineNum}, column ${colNum} without a corresponding opening '{'.`,
            line: lineNum,
            column: colNum,
            remediation: `Check brace matching on line ${lineNum} or remove the extraneous '}'.`,
            isFatal: true
          });
        } else {
          braceStack.pop();
        }
      } else if (c === ')') {
        if (braceStack.length === 0 || braceStack[braceStack.length - 1].char !== '(') {
          errors.push({
            type: 'SYNTAX_ERROR',
            severity: 'error',
            title: "error: unexpected ')' token",
            message: `Unmatched closing parenthesis ')' on line ${lineNum}, column ${colNum}.`,
            line: lineNum,
            column: colNum,
            remediation: `Check parenthesis matching on line ${lineNum}.`,
            isFatal: true
          });
        } else {
          braceStack.pop();
        }
      }
    }
  }

  if (braceStack.length > 0) {
    const unclosed = braceStack[braceStack.length - 1];
    errors.push({
      type: 'SYNTAX_ERROR',
      severity: 'error',
      title: `error: expected '${unclosed.char === '{' ? '}' : ')'}' at end of input`,
      message: `Unclosed '${unclosed.char}' opened on line ${unclosed.line}, column ${unclosed.col}. Compiler reached end of file while parsing scope.`,
      line: unclosed.line,
      column: unclosed.col,
      remediation: `Add a closing '${unclosed.char === '{' ? '}' : ')'}' to match the opening '${unclosed.char}' from line ${unclosed.line}.`,
      isFatal: true
    });
  }

  // 3. Statement Semicolon Check & Type Validation
  const declaredVariables = new Set<string>();
  const deletedPointers = new Set<string>();

  // Pre-seed common standard library symbols, keywords, and types
  [
    'cout', 'cin', 'endl', 'std', 'vector', 'queue', 'stack', 'string', 'pair', 'map', 'set',
    'this', 'nullptr', 'NULL', 'true', 'false', 'min', 'max', 'size', 'push_back', 'pop',
    'front', 'back', 'top', 'empty', 'resize', 'clear', 'begin', 'end', 'auto'
  ].forEach(s => declaredVariables.add(s));

  let inBlockCommentPass3 = false;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const lineNum = idx + 1;
    const rawLine = rawLines[idx];

    // Handle block comments in pass 3
    if (rawLine.includes('/*')) {
      inBlockCommentPass3 = true;
    }
    if (inBlockCommentPass3) {
      if (rawLine.includes('*/')) {
        inBlockCommentPass3 = false;
      }
      continue;
    }
    
    // Strip single-line comments for syntax validation
    const line = lines[idx].replace(/\/\/.*$/, '').trim();
    const endCol = (rawLine.replace(/\/\/.*$/, '').trimEnd().length || 1) + 1;

    if (!line || line.startsWith('#') || line.startsWith('using')) {
      continue;
    }

    // Auto-register function parameters: e.g. addEdge(int src, int dest) or Graph(int vertices)
    const paramMatches = line.matchAll(/\b(?:int|float|double|char|bool|auto|Graph|std::string)\s+([a-zA-Z_]\w*)/g);
    for (const match of paramMatches) {
      declaredVariables.add(match[1]);
    }

    // Auto-register range-based for loop variables: for (int neighbor : adjList[currentVertex])
    const rangeForMatch = line.match(/for\s*\(\s*(?:auto|const\s+auto&?|[a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s*:/);
    if (rangeForMatch) {
      declaredVariables.add(rangeForMatch[1]);
    }

    // Access specifiers (private:, public:, protected:) and switch labels (case ..., default:)
    const isLabelOrSpecifier = 
      /^(private|public|protected|default)\s*:?$/.test(line) ||
      /^case\s+.*:?$/.test(line) ||
      line.endsWith(':');

    if (isLabelOrSpecifier) {
      continue;
    }

    // Function signatures, constructors, classes, templates, and control flow
    const isControlOrHeader = 
      line.endsWith('{') ||
      line.endsWith('}') ||
      line.endsWith('};') ||
      line.endsWith(',') ||
      line.endsWith('<<') ||
      /^(class|struct|enum|namespace)\b/.test(line) ||
      /^(template\s*<)/.test(line) ||
      /^(if|else|while|for|switch|catch|do)\b/.test(line) ||
      /\([^)]*\)\s*(const)?\s*(:\s*.*)?\{?$/.test(line) ||
      /^[a-zA-Z_]\w*\s*\([^)]*\)\s*(const)?\s*\{?$/.test(line) ||
      line === '{' || line === '}' || line === '};';

    // Check incomplete assignment: e.g. int b = or x =
    if (line.endsWith('=')) {
      const eqCol = rawLine.lastIndexOf('=') + 2;
      errors.push({
        type: 'SYNTAX_ERROR',
        severity: 'error',
        title: "error: expected expression after '='",
        message: `Line ${lineNum}, column ${eqCol}: Incomplete assignment statement. Expected a value or expression after '=' before the statement can end.`,
        line: lineNum,
        column: eqCol,
        remediation: `Provide a value or expression after '=' (e.g. '${line} 0;') on line ${lineNum}.`,
        isFatal: true
      });
      continue;
    }

    // Check missing semicolon on statements
    if (!isControlOrHeader && !line.endsWith(';')) {
      errors.push({
        type: 'SYNTAX_ERROR',
        severity: 'error',
        title: "error: expected ';' before end of line",
        message: `Statement on line ${lineNum}, column ${endCol} is missing a terminating semicolon ';'. In C++, all declaration, assignment, call, and return statements must end with a semicolon.`,
        line: lineNum,
        column: endCol,
        remediation: `Add a semicolon ';' to the end of line ${lineNum}.`,
        isFatal: true
      });
    }

    // General Variable / Object / Container declaration tracking:
    // e.g. int a = 10; or int* p = &x; or Graph g(5); or std::vector<int> adjList; or queue<int> q;
    const declMatch = line.match(/^(?:const\s+)?(?:[a-zA-Z_]\w*::)*([a-zA-Z_]\w*)(?:<[^;{}()]+>)?\s*\*?\s*([a-zA-Z_]\w*)\s*(?:=|\(|\{|;)/);
    if (declMatch && !['return', 'delete', 'if', 'while', 'for', 'switch', 'case', 'class', 'struct'].includes(declMatch[1])) {
      const typeName = declMatch[1];
      const varName = declMatch[2];
      declaredVariables.add(varName);
      const varCol = rawLine.indexOf(varName) + 1;

      // Check type mismatch like: int a = "hello";
      if (line.includes('=') && (typeName === 'int' || typeName === 'float' || typeName === 'double')) {
        if (/=\s*"[^"]*"/.test(line)) {
          const strCol = rawLine.indexOf('"') + 1;
          errors.push({
            type: 'TYPE_MISMATCH',
            severity: 'error',
            title: "error: cannot convert 'const char*' to numeric type",
            message: `Type mismatch on line ${lineNum}, column ${strCol}: cannot initialize variable '${varName}' of type '${typeName}' with a string literal.`,
            line: lineNum,
            column: strCol,
            remediation: `Assign a numeric value (e.g. 'int ${varName} = 10;') instead of a string.`,
            isFatal: true
          });
        }
      }

      // Check pointer without address or new: e.g. int* p = 10;
      if (line.includes('*') && line.includes('=') && !line.includes('&') && !line.includes('new') && !line.includes('nullptr') && !line.includes('NULL')) {
        const valPart = line.split('=')[1]?.replace(';', '').trim();
        if (/^\d+$/.test(valPart)) {
          const numCol = rawLine.lastIndexOf(valPart) + 1;
          errors.push({
            type: 'TYPE_MISMATCH',
            severity: 'error',
            title: "error: invalid conversion from 'int' to pointer",
            message: `Line ${lineNum}, column ${numCol}: Cannot assign integer literal '${valPart}' directly to pointer variable '${varName}'. Pointers hold memory addresses, not raw values.`,
            line: lineNum,
            column: numCol,
            remediation: `Use address-of operator '&' (e.g. 'int* ${varName} = &someVar;') or dynamic allocation ('new int(${valPart})').`,
            isFatal: true
          });
        }
      }
    }

    // Check undeclared variable use on assignments like: x = 20;
    const assignMatch = line.match(/^([a-zA-Z_]\w*)\s*=/);
    if (assignMatch && !declMatch) {
      const varName = assignMatch[1];
      const varCol = rawLine.indexOf(varName) + 1;
      if (!declaredVariables.has(varName) && varName !== 'std') {
        errors.push({
          type: 'UNDEFINED_REFERENCE',
          severity: 'error',
          title: `error: '${varName}' was not declared in this scope`,
          message: `Variable '${varName}' is used on line ${lineNum}, column ${varCol} without being declared. In C++, all variables must be declared with a data type before assignment.`,
          line: lineNum,
          column: varCol,
          remediation: `Declare '${varName}' with a type before assigning it (e.g. 'int ${varName} = ...;').`,
          isFatal: true
        });
      }
    }

    // Check delete operator
    const deleteMatch = line.match(/\bdelete\s+([a-zA-Z_]\w*);?/);
    if (deleteMatch) {
      const ptrName = deleteMatch[1];
      deletedPointers.add(ptrName);
    }

    // Check use after free (dangling pointer dereference)
    const derefMatch = line.match(/\*([a-zA-Z_]\w*)\s*=/);
    if (derefMatch) {
      const ptrName = derefMatch[1];
      const derefCol = rawLine.indexOf('*' + ptrName) + 1;
      if (deletedPointers.has(ptrName)) {
        errors.push({
          type: 'DANGLING_POINTER',
          severity: 'error',
          title: "error: segmentation fault (use-after-free)",
          message: `Dereferencing pointer '*${ptrName}' on line ${lineNum}, column ${derefCol} after it has already been freed with 'delete ${ptrName};'. This causes undefined behavior or a Segmentation Fault.`,
          line: lineNum,
          column: derefCol,
          remediation: `Do not access heap memory through '${ptrName}' after calling 'delete'. Re-assign '${ptrName} = nullptr;' or reallocate it with 'new'.`,
          isFatal: true
        });
      }
    }

    // Check division by zero
    if (/\/\s*0\b/.test(line)) {
      const divCol = rawLine.indexOf('/ 0') + 1;
      warnings.push({
        type: 'COMPILATION_ERROR',
        severity: 'warning',
        title: "warning: division by zero [-Wdiv-by-zero]",
        message: `Line ${lineNum}, column ${divCol} contains division by zero, which results in a SIGFPE (Floating Point Exception) runtime crash.`,
        line: lineNum,
        column: divCol,
        remediation: "Ensure denominators are non-zero."
      });
    }
  }

  return {
    hasErrors: errors.length > 0,
    errors,
    warnings
  };
}
