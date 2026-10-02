export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'NUMBER'
  | 'OPERATOR'
  | 'DELIMITER'
  | 'TYPE'
  | 'STRING'
  | 'COMMENT';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export type ScopeType = 'Global' | 'Local' | 'Static' | 'Dynamic';
export type VariableStatus = 'created' | 'used' | 'destroyed' | 'freed' | 'leaked';

export interface SymbolTableEntry {
  name: string;
  type: string;
  scope: ScopeType;
  address: string;
  sizeBytes: number;
  value: string;
  status: VariableStatus;
  frameName?: string;
}

export interface ASTNode {
  id: string;
  type: string;
  label: string;
  details?: string;
  children?: ASTNode[];
  line?: number;
}

export interface StackVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  sizeBytes: number;
  scope: ScopeType;
  status: VariableStatus;
  isPointer?: boolean;
  pointsToAddress?: string;
  isArray?: boolean;
  arrayElements?: { index: number; value: string; address: string }[];
}

export interface StackFrame {
  id: string;
  functionName: string;
  returnAddress: string;
  basePointer: string;
  stackPointer: string;
  variables: StackVariable[];
  isCurrent: boolean;
}

export interface HeapBlock {
  id: string;
  address: string;
  type: string;
  value: string;
  sizeBytes: number;
  allocatedAtLine: number;
  allocatedByPointer: string;
  isFreed: boolean;
  isLeaked: boolean;
}

export interface StaticVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  scope: ScopeType;
  isStatic: boolean;
}

export interface TextInstruction {
  address: string;
  assembly: string;
  sourceLine: number;
  isCurrent: boolean;
}

export interface PointerArrow {
  id: string;
  fromVarName: string;
  fromAddress: string;
  toAddress: string;
  targetType: 'stack' | 'heap' | 'data';
}

export interface MemoryMetrics {
  stackBytes: number;
  heapBytes: number;
  variableCount: number;
  callStackDepth: number;
}

export interface DiagnosticWarning {
  type: 
    | 'COMPILATION_ERROR' 
    | 'SYNTAX_ERROR' 
    | 'TYPE_MISMATCH' 
    | 'UNDEFINED_REFERENCE'
    | 'MEMORY_LEAK' 
    | 'STACK_OVERFLOW' 
    | 'DANGLING_POINTER' 
    | 'UNINITIALIZED_READ'
    | 'SEGMENTATION_FAULT';
  severity: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  line: number;
  column?: number;
  remediation?: string;
  isFatal?: boolean;
}

export interface MemoryStep {
  stepIndex: number;
  totalSteps: number;
  currentLine: number;
  codeLineText: string;
  phase: 'Lexing' | 'Parsing' | 'Semantic' | 'Memory Allocation' | 'Execution';
  explanation: string;
  programCounter: string;
  stackFrames: StackFrame[];
  heapBlocks: HeapBlock[];
  dataSegment: StaticVariable[];
  textSegment: TextInstruction[];
  symbolTable: SymbolTableEntry[];
  tokens: Token[];
  astRoot: ASTNode;
  activeAstNodeId?: string;
  pointerArrows: PointerArrow[];
  metrics: MemoryMetrics;
  warnings: DiagnosticWarning[];
  stdout?: string;
}

export interface PresetProgram {
  id: string;
  title: string;
  tagline: string;
  concept: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  code: string;
  explanation: string;
  takeaway: string;
}
