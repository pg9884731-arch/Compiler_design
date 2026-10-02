import { Token, TokenType } from './types';

const KEYWORDS = new Set([
  '#include', 'using', 'namespace', 'std', 'return', 'if', 'else', 'while', 'for', 'do',
  'new', 'delete', 'static', 'const', 'sizeof', 'class', 'struct', 'private', 'public',
  'protected', 'template', 'typename', 'switch', 'case', 'default', 'break', 'continue', 'true', 'false'
]);

const TYPES = new Set([
  'int', 'void', 'float', 'double', 'char', 'bool', 'auto', 'long', 'short', 'string',
  'vector', 'queue', 'stack', 'pair', 'map', 'set', 'size_t', 'uint32_t', 'int64_t'
]);

export function tokenize(sourceCode: string): Token[] {
  const tokens: Token[] = [];
  const lines = sourceCode.split('\n');
  let inBlockComment = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let col = 0;

    while (col < line.length) {
      // Check multi-line block comments
      if (inBlockComment) {
        const endIdx = line.indexOf('*/', col);
        if (endIdx !== -1) {
          inBlockComment = false;
          col = endIdx + 2;
        } else {
          col = line.length;
        }
        continue;
      }

      if (line[col] === '/' && line[col + 1] === '*') {
        inBlockComment = true;
        col += 2;
        continue;
      }

      // Skip whitespace
      if (/\s/.test(line[col])) {
        col++;
        continue;
      }

      // Single line comments
      if (line[col] === '/' && line[col + 1] === '/') {
        tokens.push({
          type: 'COMMENT',
          value: line.slice(col).trim(),
          line: lineIndex + 1,
          col: col + 1
        });
        break;
      }

      // Preprocessor or includes
      if (line[col] === '#') {
        const match = line.slice(col).match(/^#\w+(<[^>]+>)?/);
        if (match) {
          tokens.push({
            type: 'KEYWORD',
            value: match[0],
            line: lineIndex + 1,
            col: col + 1
          });
          col += match[0].length;
          continue;
        }
      }

      // String literals
      if (line[col] === '"' || line[col] === "'") {
        const quote = line[col];
        let str = quote;
        let c = col + 1;
        while (c < line.length && line[c] !== quote) {
          str += line[c];
          c++;
        }
        if (c < line.length) str += quote;
        tokens.push({
          type: 'STRING',
          value: str,
          line: lineIndex + 1,
          col: col + 1
        });
        col = c + 1;
        continue;
      }

      // Numbers (decimal or hex)
      if (/\d/.test(line[col])) {
        const match = line.slice(col).match(/^0x[0-9a-fA-F]+|^\d+(\.\d+)?/);
        if (match) {
          tokens.push({
            type: 'NUMBER',
            value: match[0],
            line: lineIndex + 1,
            col: col + 1
          });
          col += match[0].length;
          continue;
        }
      }

      // Identifiers & Keywords
      if (/[a-zA-Z_]/.test(line[col])) {
        const match = line.slice(col).match(/^[a-zA-Z_]\w*/);
        if (match) {
          const val = match[0];
          let type: TokenType = 'IDENTIFIER';
          if (TYPES.has(val)) {
            type = 'TYPE';
          } else if (KEYWORDS.has(val)) {
            type = 'KEYWORD';
          }

          tokens.push({
            type,
            value: val,
            line: lineIndex + 1,
            col: col + 1
          });
          col += match[0].length;
          continue;
        }
      }

      // Multi-character Operators
      const op2 = line.slice(col, col + 2);
      if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '->', '::', '<<', '>>'].includes(op2)) {
        tokens.push({
          type: 'OPERATOR',
          value: op2,
          line: lineIndex + 1,
          col: col + 1
        });
        col += 2;
        continue;
      }

      // Single-character Operators
      if (['+', '-', '*', '/', '%', '=', '<', '>', '&', '|', '!', '^', '~'].includes(line[col])) {
        tokens.push({
          type: 'OPERATOR',
          value: line[col],
          line: lineIndex + 1,
          col: col + 1
        });
        col++;
        continue;
      }

      // Delimiters
      if (['(', ')', '{', '}', '[', ']', ';', ',', '.', ':'].includes(line[col])) {
        tokens.push({
          type: 'DELIMITER',
          value: line[col],
          line: lineIndex + 1,
          col: col + 1
        });
        col++;
        continue;
      }

      // Unknown fallback
      col++;
    }
  }

  return tokens;
}
