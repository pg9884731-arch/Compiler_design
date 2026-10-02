import { Token, ASTNode } from './types';

export function parseAST(tokens: Token[], sourceCode: string): ASTNode {
  const root: ASTNode = {
    id: 'ast-root',
    type: 'Program',
    label: 'Translation Unit (Program)',
    details: 'Global Translation Unit',
    children: []
  };

  const lines = sourceCode.split('\n');

  // Group tokens by line
  const lineTokensMap = new Map<number, Token[]>();
  for (const t of tokens) {
    if (!lineTokensMap.has(t.line)) {
      lineTokensMap.set(t.line, []);
    }
    lineTokensMap.get(t.line)!.push(t);
  }

  let currentFunction: ASTNode | null = null;

  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const rawLine = lines[lineNum - 1].trim();
    const lineTokens = lineTokensMap.get(lineNum) || [];

    if (!rawLine || rawLine.startsWith('//')) continue;

    // Header directives
    if (rawLine.startsWith('#include') || rawLine.startsWith('using namespace')) {
      root.children?.push({
        id: `ast-preproc-${lineNum}`,
        type: 'Directive',
        label: rawLine.replace(';', ''),
        line: lineNum
      });
      continue;
    }

    // Function declaration/definition, e.g. int main(){ or void add(){
    const funcMatch = rawLine.match(/^(int|void|float|char|double|bool)\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*\{?/);
    if (funcMatch) {
      const returnType = funcMatch[1];
      const funcName = funcMatch[2];
      const params = funcMatch[3];

      const funcNode: ASTNode = {
        id: `ast-func-${funcName}-${lineNum}`,
        type: 'FunctionDeclaration',
        label: `${funcName}() : ${returnType}`,
        details: params ? `Params: (${params})` : 'No parameters',
        line: lineNum,
        children: []
      };

      if (params.trim()) {
        const paramList = params.split(',').map(p => p.trim());
        for (let i = 0; i < paramList.length; i++) {
          funcNode.children?.push({
            id: `ast-param-${funcName}-${i}`,
            type: 'Parameter',
            label: paramList[i],
            line: lineNum
          });
        }
      }

      root.children?.push(funcNode);
      currentFunction = funcNode;
      continue;
    }

    // End of function block
    if (rawLine === '}' && currentFunction) {
      currentFunction = null;
      continue;
    }

    const parentNode = currentFunction || root;

    // Pointer declaration, e.g. int* p = new int(50); or int *p = &x;
    const ptrMatch = rawLine.match(/^(int|void|float|char|double)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*(.+);/);
    if (ptrMatch) {
      const baseType = ptrMatch[1];
      const varName = ptrMatch[2];
      const rhs = ptrMatch[3].trim();

      const declNode: ASTNode = {
        id: `ast-ptr-${varName}-${lineNum}`,
        type: 'PointerDeclaration',
        label: `${baseType}* ${varName}`,
        line: lineNum,
        children: []
      };

      if (rhs.startsWith('new ')) {
        declNode.children?.push({
          id: `ast-new-${lineNum}`,
          type: 'DynamicAllocation',
          label: rhs,
          details: 'Allocates memory on Heap',
          line: lineNum
        });
      } else if (rhs.startsWith('&')) {
        declNode.children?.push({
          id: `ast-addr-${lineNum}`,
          type: 'AddressOfExpression',
          label: rhs,
          details: `Stores address of variable ${rhs.slice(1)}`,
          line: lineNum
        });
      }

      parentNode.children?.push(declNode);
      continue;
    }

    // Delete expression, e.g. delete p;
    const deleteMatch = rawLine.match(/^delete\s+([a-zA-Z_]\w*)\s*;/);
    if (deleteMatch) {
      parentNode.children?.push({
        id: `ast-delete-${deleteMatch[1]}-${lineNum}`,
        type: 'DeleteExpression',
        label: `delete ${deleteMatch[1]}`,
        details: `Frees heap allocation referenced by ${deleteMatch[1]}`,
        line: lineNum
      });
      continue;
    }

    // Array declaration, e.g. int arr[5] = {1, 2, 3, 4, 5};
    const arrMatch = rawLine.match(/^(int|float|char|double)\s+([a-zA-Z_]\w*)\[(\d*)\]\s*=\s*\{([^}]*)\}\s*;/);
    if (arrMatch) {
      const type = arrMatch[1];
      const name = arrMatch[2];
      const size = arrMatch[3] || 'computed';
      const items = arrMatch[4];

      parentNode.children?.push({
        id: `ast-arr-${name}-${lineNum}`,
        type: 'ArrayDeclaration',
        label: `${type} ${name}[${size}]`,
        details: `Contiguous allocation: { ${items} }`,
        line: lineNum
      });
      continue;
    }

    // Primitive variable declaration, e.g. int a = 10;
    const varMatch = rawLine.match(/^(int|float|char|double|bool)\s+([a-zA-Z_]\w*)\s*=\s*(.+);/);
    if (varMatch) {
      const type = varMatch[1];
      const name = varMatch[2];
      const val = varMatch[3].trim();

      parentNode.children?.push({
        id: `ast-var-${name}-${lineNum}`,
        type: currentFunction ? 'LocalVariableDeclaration' : 'GlobalVariableDeclaration',
        label: `${type} ${name} = ${val}`,
        details: currentFunction ? 'Allocated on Stack Frame' : 'Allocated in Data Segment',
        line: lineNum
      });
      continue;
    }

    // Function call statement, e.g. add(); or factorial(3);
    const callMatch = rawLine.match(/^([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*;/);
    if (callMatch) {
      parentNode.children?.push({
        id: `ast-call-${callMatch[1]}-${lineNum}`,
        type: 'FunctionCall',
        label: `${callMatch[1]}(${callMatch[2]})`,
        details: 'Transfers control & creates new Activation Record',
        line: lineNum
      });
      continue;
    }

    // Dereference assignment, e.g. *p = 42;
    const derefMatch = rawLine.match(/^\*([a-zA-Z_]\w*)\s*=\s*(.+);/);
    if (derefMatch) {
      parentNode.children?.push({
        id: `ast-deref-${derefMatch[1]}-${lineNum}`,
        type: 'DereferenceAssignment',
        label: `*${derefMatch[1]} = ${derefMatch[2]}`,
        details: `Mutates value at address held in ${derefMatch[1]}`,
        line: lineNum
      });
      continue;
    }

    // Return statement
    const returnMatch = rawLine.match(/^return\s*(.*);/);
    if (returnMatch) {
      parentNode.children?.push({
        id: `ast-ret-${lineNum}`,
        type: 'ReturnStatement',
        label: `return ${returnMatch[1]}`,
        details: 'Returns value & pops stack frame',
        line: lineNum
      });
      continue;
    }
  }

  return root;
}
