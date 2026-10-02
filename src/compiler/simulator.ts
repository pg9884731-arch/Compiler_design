import {
  Token,
  ASTNode,
  MemoryStep,
  StackFrame,
  StackVariable,
  HeapBlock,
  StaticVariable,
  TextInstruction,
  SymbolTableEntry,
  PointerArrow,
  DiagnosticWarning
} from './types';
import { tokenize } from './lexer';
import { parseAST } from './parser';
import { validateCppCode } from './validator';

export function simulateExecution(sourceCode: string): MemoryStep[] {
  // Validate C++ syntax and semantics first
  const validation = validateCppCode(sourceCode);
  const tokens = tokenize(sourceCode);
  const astRoot = parseAST(tokens, sourceCode);
  const lines = sourceCode.split('\n');

  // If fatal compilation errors exist, stop and return the compilation error snapshot
  if (validation.hasErrors) {
    const firstErr = validation.errors[0];
    const errorLineText = lines[firstErr.line - 1] || '';

    return [{
      stepIndex: 0,
      totalSteps: 1,
      currentLine: firstErr.line,
      codeLineText: errorLineText,
      phase: 'Parsing',
      explanation: `[COMPILATION FAILED] ${firstErr.title}: ${firstErr.message} ${firstErr.remediation ? `Fix: ${firstErr.remediation}` : ''}`,
      programCounter: '0x00000000',
      stackFrames: [],
      heapBlocks: [],
      dataSegment: [],
      textSegment: [{
        address: '0x00000000',
        assembly: `// COMPILATION HALTED: ${firstErr.title}`,
        sourceLine: firstErr.line,
        isCurrent: true
      }],
      symbolTable: [],
      tokens,
      astRoot,
      pointerArrows: [],
      metrics: {
        stackBytes: 0,
        heapBytes: 0,
        variableCount: 0,
        callStackDepth: 0
      },
      warnings: [...validation.errors, ...validation.warnings],
      stdout: `g++: fatal error: compilation terminated due to errors on line ${firstErr.line}.\n`
    }];
  }

  const steps: MemoryStep[] = [];

  // Memory Base Addresses (simulating realistic 64-bit virtual memory layout)
  const TEXT_BASE = 0x00400000;
  const DATA_BASE = 0x00600000;
  const HEAP_BASE = 0x01000000;
  const STACK_TOP = 0x7ffe8300;

  let currentStackPtr = STACK_TOP;
  let currentHeapPtr = HEAP_BASE;

  // Persistent memory state
  const dataSegment: StaticVariable[] = [];
  const heapBlocks: HeapBlock[] = [];
  const stackFrames: StackFrame[] = [];
  const textSegment: TextInstruction[] = [];
  const symbolTable: SymbolTableEntry[] = [];
  let stdout = '';

  // Pre-populate Text Segment from source lines
  lines.forEach((lineText, idx) => {
    const trimmed = lineText.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#') && !trimmed.startsWith('using')) {
      textSegment.push({
        address: `0x${(TEXT_BASE + textSegment.length * 4).toString(16).toUpperCase()}`,
        assembly: generatePseudoAssembly(trimmed),
        sourceLine: idx + 1,
        isCurrent: false
      });
    }
  });

  // Helper to clone state for a snapshot
  const createSnapshot = (
    stepIdx: number,
    lineNum: number,
    codeText: string,
    phase: MemoryStep['phase'],
    explanation: string,
    activeAstId?: string
  ): MemoryStep => {
    // Generate pointer arrows
    const pointerArrows: PointerArrow[] = [];

    // Check stack variables for pointers
    stackFrames.forEach(frame => {
      frame.variables.forEach(v => {
        if (v.isPointer && v.pointsToAddress && v.pointsToAddress !== '0x00000000') {
          // Check if points to heap or stack
          const isHeap = heapBlocks.some(h => h.address === v.pointsToAddress);
          pointerArrows.push({
            id: `arrow-${v.name}-${v.pointsToAddress}`,
            fromVarName: v.name,
            fromAddress: v.address,
            toAddress: v.pointsToAddress,
            targetType: isHeap ? 'heap' : 'stack'
          });
        }
      });
    });

    // Check for diagnostic warnings
    const warnings: DiagnosticWarning[] = [];

    // 1. Memory Leak Check: unreleased heap blocks when pointer variable is gone or at termination
    heapBlocks.forEach(block => {
      if (!block.isFreed) {
        // Check if any active pointer still points to this address
        const hasActiveRef = stackFrames.some(frame =>
          frame.variables.some(v => v.isPointer && v.pointsToAddress === block.address)
        );
        if (!hasActiveRef || block.isLeaked) {
          block.isLeaked = true;
          warnings.push({
            type: 'MEMORY_LEAK',
            severity: 'error',
            title: 'Memory Leak Detected',
            message: `Heap object at address ${block.address} (${block.sizeBytes} bytes) was allocated at line ${block.allocatedAtLine} but has no remaining active pointer referencing it. It will never be freed.`,
            line: lineNum,
            remediation: `Always pair dynamic 'new ${block.type}' with a corresponding 'delete ${block.allocatedByPointer};' before the pointer exits scope.`
          });
        }
      }
    });

    // 2. Stack Overflow Risk Check
    if (stackFrames.length >= 5) {
      warnings.push({
        type: 'STACK_OVERFLOW',
        severity: 'warning',
        title: 'Stack Overflow Risk',
        message: `Call stack depth has reached ${stackFrames.length} frames. Deep recursion risks exhausting available stack segment memory.`,
        line: lineNum,
        remediation: 'Verify your base condition is reached, or consider converting recursion to iteration using an explicit loop.'
      });
    }

    // Calculate metrics
    let totalStackBytes = 0;
    let varCount = dataSegment.length;
    stackFrames.forEach(f => {
      f.variables.forEach(v => {
        totalStackBytes += v.sizeBytes;
        varCount++;
      });
    });

    let totalHeapBytes = 0;
    heapBlocks.forEach(h => {
      if (!h.isFreed) totalHeapBytes += h.sizeBytes;
    });

    // Update text segment active line
    const updatedText = textSegment.map(t => ({
      ...t,
      isCurrent: t.sourceLine === lineNum
    }));

    const pc = updatedText.find(t => t.isCurrent)?.address || `0x${TEXT_BASE.toString(16).toUpperCase()}`;

    return {
      stepIndex: stepIdx,
      totalSteps: 0, // updated at end
      currentLine: lineNum,
      codeLineText: codeText,
      phase,
      explanation,
      programCounter: pc,
      stackFrames: JSON.parse(JSON.stringify(stackFrames)),
      heapBlocks: JSON.parse(JSON.stringify(heapBlocks)),
      dataSegment: JSON.parse(JSON.stringify(dataSegment)),
      textSegment: updatedText,
      symbolTable: JSON.parse(JSON.stringify(symbolTable)),
      tokens,
      astRoot,
      activeAstNodeId: activeAstId,
      pointerArrows,
      metrics: {
        stackBytes: totalStackBytes,
        heapBytes: totalHeapBytes,
        variableCount: varCount,
        callStackDepth: stackFrames.length
      },
      warnings,
      stdout
    };
  };

  // --- Step Generation Pipeline ---

  // Initial Step 0: Compiler Ready
  steps.push(
    createSnapshot(
      0,
      1,
      lines[0] || '',
      'Lexing',
      'Lexer scanned code and identified tokens. Ready to analyze syntactic structure and simulate virtual memory allocation.'
    )
  );

  // Scan for Global Variables (e.g. int globalVar = 100;)
  lines.forEach((lineText, lineIdx) => {
    const trimmed = lineText.trim();
    const globalMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*)\s*=\s*([^;]+);/);

    // If outside any function (before main or after)
    const isOutsideFunc = !lines.slice(0, lineIdx).some(l => l.includes('int main') || l.includes('void add'));

    if (globalMatch && isOutsideFunc) {
      const type = globalMatch[1];
      const name = globalMatch[2];
      const val = globalMatch[3].trim();
      const addr = `0x${(DATA_BASE + dataSegment.length * 4).toString(16).toUpperCase()}`;

      dataSegment.push({
        name,
        type,
        value: val,
        address: addr,
        scope: 'Global',
        isStatic: false
      });

      symbolTable.push({
        name,
        type,
        scope: 'Global',
        address: addr,
        sizeBytes: 4,
        value: val,
        status: 'created'
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineIdx + 1,
          trimmed,
          'Memory Allocation',
          `[DATA SEGMENT] Allocated 4 bytes for global variable '${name}' with value ${val} at fixed address ${addr}. Global variables persist for the entire lifetime of the program.`,
          `ast-var-${name}-${lineIdx + 1}`
        )
      );
    }
  });

  // Check if main() exists
  const mainLineIndex = lines.findIndex(l => l.includes('main('));
  if (mainLineIndex !== -1) {
    // Push main() stack frame
    const mainFrameAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
    currentStackPtr -= 32;

    const mainFrame: StackFrame = {
      id: 'frame-main',
      functionName: 'main',
      returnAddress: '0x00401020 (OS loader)',
      basePointer: mainFrameAddr,
      stackPointer: `0x${currentStackPtr.toString(16).toUpperCase()}`,
      variables: [],
      isCurrent: true
    };
    stackFrames.push(mainFrame);

    steps.push(
      createSnapshot(
        steps.length,
        mainLineIndex + 1,
        lines[mainLineIndex].trim(),
        'Memory Allocation',
        `[STACK] OS created main() thread and pushed activation record onto Stack at base ${mainFrameAddr}. Stack grows downwards from higher to lower addresses.`,
        `ast-func-main-${mainLineIndex + 1}`
      )
    );
  }

  // Helper to get active stack frame
  const getActiveFrame = (): StackFrame => {
    return stackFrames[stackFrames.length - 1];
  };

  // Step through code lines inside main / other functions
  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const rawLine = lines[lineNum - 1];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('using')) {
      continue;
    }

    // Skip global declaration since already processed
    if (trimmed.includes('globalVar =') && lineNum < (mainLineIndex + 1)) {
      continue;
    }

    if (trimmed.startsWith('int main()') || trimmed === 'int main(){') {
      continue;
    }

    // 1. Primitive Variable Declaration (e.g. int a = 10; or int b = 20;)
    const varMatch = trimmed.match(/^(int|float|double|char|bool)\s+([a-zA-Z_]\w*)\s*=\s*([^;]+);/);
    if (varMatch && !trimmed.includes('*') && !trimmed.includes('[')) {
      const type = varMatch[1];
      const name = varMatch[2];
      const val = varMatch[3].trim();
      const addr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 4;

      const activeFrame = getActiveFrame();
      if (activeFrame) {
        activeFrame.variables.push({
          name,
          type,
          value: val,
          address: addr,
          sizeBytes: 4,
          scope: 'Local',
          status: 'created'
        });
      }

      symbolTable.push({
        name,
        type,
        scope: 'Local',
        address: addr,
        sizeBytes: 4,
        value: val,
        status: 'created',
        frameName: activeFrame?.functionName
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[STACK] Pushed local variable '${name}' (${type}) with initial value ${val} to ${activeFrame?.functionName}()'s stack frame at address ${addr} (-4 bytes).`,
          `ast-var-${name}-${lineNum}`
        )
      );
      continue;
    }

    // 2. Pointer Declaration with Dynamic Memory: int* p = new int(50);
    const ptrNewMatch = trimmed.match(/^(int|float|double|char)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*new\s+\w+\s*\(([^)]*)\)\s*;/);
    if (ptrNewMatch) {
      const baseType = ptrNewMatch[1];
      const ptrName = ptrNewMatch[2];
      const initialVal = ptrNewMatch[3].trim() || '0';

      const heapAddr = `0x01${(currentHeapPtr & 0x00ffffff).toString(16).padStart(6, '0').toUpperCase()}`;
      currentHeapPtr += 16; // 4 bytes + padding

      const stackAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 8; // 64-bit pointer is 8 bytes

      heapBlocks.push({
        id: `heap-${ptrName}-${heapAddr}`,
        address: heapAddr,
        type: baseType,
        value: initialVal,
        sizeBytes: 4,
        allocatedAtLine: lineNum,
        allocatedByPointer: ptrName,
        isFreed: false,
        isLeaked: false
      });

      const activeFrame = getActiveFrame();
      if (activeFrame) {
        activeFrame.variables.push({
          name: ptrName,
          type: `${baseType}*`,
          value: heapAddr,
          address: stackAddr,
          sizeBytes: 8,
          scope: 'Local',
          status: 'created',
          isPointer: true,
          pointsToAddress: heapAddr
        });
      }

      symbolTable.push({
        name: ptrName,
        type: `${baseType}*`,
        scope: 'Dynamic',
        address: stackAddr,
        sizeBytes: 8,
        value: heapAddr,
        status: 'created',
        frameName: activeFrame?.functionName
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[HEAP + STACK] 'new ${baseType}(${initialVal})' allocated 4 bytes dynamically on the Heap at ${heapAddr}. Pointer variable '${ptrName}' (8 bytes) was stored on the Stack at ${stackAddr}, holding the Heap address.`,
          `ast-ptr-${ptrName}-${lineNum}`
        )
      );
      continue;
    }

    // 3. Pointer Declaration referencing another variable: int* p = &x;
    const ptrRefMatch = trimmed.match(/^(int|float|double|char)\s*\*\s*([a-zA-Z_]\w*)\s*=\s*&([a-zA-Z_]\w*)\s*;/);
    if (ptrRefMatch) {
      const baseType = ptrRefMatch[1];
      const ptrName = ptrRefMatch[2];
      const targetVarName = ptrRefMatch[3];

      const activeFrame = getActiveFrame();
      const targetVar = activeFrame?.variables.find(v => v.name === targetVarName);
      const targetAddr = targetVar ? targetVar.address : '0x7FFE82E0';

      const stackAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 8;

      if (activeFrame) {
        activeFrame.variables.push({
          name: ptrName,
          type: `${baseType}*`,
          value: targetAddr,
          address: stackAddr,
          sizeBytes: 8,
          scope: 'Local',
          status: 'created',
          isPointer: true,
          pointsToAddress: targetAddr
        });
      }

      symbolTable.push({
        name: ptrName,
        type: `${baseType}*`,
        scope: 'Local',
        address: stackAddr,
        sizeBytes: 8,
        value: targetAddr,
        status: 'created',
        frameName: activeFrame?.functionName
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[STACK POINTER] '${ptrName}' initialized with address of '${targetVarName}' (&${targetVarName} = ${targetAddr}). Notice the reference arrow linking '${ptrName}' directly to '${targetVarName}' on the Stack!`,
          `ast-ptr-${ptrName}-${lineNum}`
        )
      );
      continue;
    }

    // 4. Dereference Assignment: *p = 42;
    const derefMatch = trimmed.match(/^\*([a-zA-Z_]\w*)\s*=\s*([^;]+);/);
    if (derefMatch) {
      const ptrName = derefMatch[1];
      const newVal = derefMatch[2].trim();

      const activeFrame = getActiveFrame();
      const ptrVar = activeFrame?.variables.find(v => v.name === ptrName);

      if (ptrVar && ptrVar.pointsToAddress) {
        // Check if pointed to heap
        const heapBlock = heapBlocks.find(h => h.address === ptrVar.pointsToAddress);
        if (heapBlock) {
          heapBlock.value = newVal;
        }

        // Check if pointed to stack
        activeFrame.variables.forEach(v => {
          if (v.address === ptrVar.pointsToAddress) {
            v.value = newVal;
            v.status = 'used';
          }
        });

        // Update symbol table
        const sym = symbolTable.find(s => s.address === ptrVar.pointsToAddress);
        if (sym) sym.value = newVal;

        steps.push(
          createSnapshot(
            steps.length,
            lineNum,
            trimmed,
            'Execution',
            `[DEREFERENCE] '*p = ${newVal}' dereferenced pointer '${ptrName}'. Found address ${ptrVar.pointsToAddress} and updated stored value to ${newVal}.`,
            `ast-deref-${ptrName}-${lineNum}`
          )
        );
      }
      continue;
    }

    // 5. Delete Statement: delete p;
    const deleteMatch = trimmed.match(/^delete\s+([a-zA-Z_]\w*)\s*;/);
    if (deleteMatch) {
      const ptrName = deleteMatch[1];
      const activeFrame = getActiveFrame();
      const ptrVar = activeFrame?.variables.find(v => v.name === ptrName);

      if (ptrVar && ptrVar.pointsToAddress) {
        const heapBlock = heapBlocks.find(h => h.address === ptrVar.pointsToAddress);
        if (heapBlock) {
          heapBlock.isFreed = true;
          heapBlock.value = '[FREED]';
        }
      }

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[HEAP DEALLOCATION] 'delete ${ptrName};' executed. Memory block at ${ptrVar?.pointsToAddress || 'Heap'} was marked FREED and returned to OS memory pool.`,
          `ast-delete-${ptrName}-${lineNum}`
        )
      );
      continue;
    }

    // 6. Array Declaration: int arr[5] = {1, 2, 3, 4, 5};
    const arrMatch = trimmed.match(/^(int|float|double|char)\s+([a-zA-Z_]\w*)\[(\d+)\]\s*=\s*\{([^}]*)\}\s*;/);
    if (arrMatch) {
      const type = arrMatch[1];
      const name = arrMatch[2];
      const count = parseInt(arrMatch[3], 10);
      const items = arrMatch[4].split(',').map(s => s.trim());

      const baseAddr = currentStackPtr;
      const elements: { index: number; value: string; address: string }[] = [];

      for (let i = 0; i < count; i++) {
        const elemAddr = `0x${(baseAddr - i * 4).toString(16).toUpperCase()}`;
        elements.push({
          index: i,
          value: items[i] || '0',
          address: elemAddr
        });
      }
      currentStackPtr -= count * 4;

      const activeFrame = getActiveFrame();
      if (activeFrame) {
        activeFrame.variables.push({
          name,
          type: `${type}[${count}]`,
          value: `[${items.join(', ')}]`,
          address: `0x${baseAddr.toString(16).toUpperCase()}`,
          sizeBytes: count * 4,
          scope: 'Local',
          status: 'created',
          isArray: true,
          arrayElements: elements
        });
      }

      symbolTable.push({
        name,
        type: `${type}[${count}]`,
        scope: 'Local',
        address: `0x${baseAddr.toString(16).toUpperCase()}`,
        sizeBytes: count * 4,
        value: `[${items.join(', ')}]`,
        status: 'created',
        frameName: activeFrame?.functionName
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[STACK ARRAY] Allocated contiguous ${count * 4} bytes for '${name}[${count}]' at base address 0x${baseAddr.toString(16).toUpperCase()}. Each element occupies exactly 4 contiguous bytes: arr[i] = base + i * 4.`,
          `ast-arr-${name}-${lineNum}`
        )
      );
      continue;
    }

    // 7. Array element assignment: arr[2] = 99;
    const arrElemMatch = trimmed.match(/^([a-zA-Z_]\w*)\[(\d+)\]\s*=\s*([^;]+);/);
    if (arrElemMatch) {
      const name = arrElemMatch[1];
      const idx = parseInt(arrElemMatch[2], 10);
      const newVal = arrElemMatch[3].trim();

      const activeFrame = getActiveFrame();
      const arrVar = activeFrame?.variables.find(v => v.name === name);
      if (arrVar && arrVar.arrayElements && arrVar.arrayElements[idx]) {
        arrVar.arrayElements[idx].value = newVal;
        arrVar.status = 'used';

        steps.push(
          createSnapshot(
            steps.length,
            lineNum,
            trimmed,
            'Execution',
            `[ARRAY MUTATION] Modified ${name}[${idx}] at address ${arrVar.arrayElements[idx].address} to ${newVal}. Memory offset = base + (${idx} * 4).`,
            `ast-arr-${name}-${lineNum}`
          )
        );
      }
      continue;
    }

    // 8. Function Call: add();
    if (trimmed === 'add();' || trimmed.match(/^add\(\);/)) {
      // Push add() stack frame
      const addFrameAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 24;

      const addFrame: StackFrame = {
        id: `frame-add-${steps.length}`,
        functionName: 'add',
        returnAddress: `0x${(TEXT_BASE + 0x48).toString(16).toUpperCase()} (main+18)`,
        basePointer: addFrameAddr,
        stackPointer: `0x${currentStackPtr.toString(16).toUpperCase()}`,
        variables: [],
        isCurrent: true
      };

      // Deactivate main frame as current
      stackFrames.forEach(f => (f.isCurrent = false));
      stackFrames.push(addFrame);

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[FUNCTION CALL] 'add()' invoked! CPU pushed return address to stack and allocated new Stack Frame for 'add()' at ${addFrameAddr}.`,
          `ast-call-add-${lineNum}`
        )
      );

      // Execute body of add() -> int x = 5;
      const xAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 4;
      addFrame.variables.push({
        name: 'x',
        type: 'int',
        value: '5',
        address: xAddr,
        sizeBytes: 4,
        scope: 'Local',
        status: 'created'
      });

      symbolTable.push({
        name: 'x',
        type: 'int',
        scope: 'Local',
        address: xAddr,
        sizeBytes: 4,
        value: '5',
        status: 'created',
        frameName: 'add'
      });

      steps.push(
        createSnapshot(
          steps.length,
          4, // line in add()
          'int x = 5;',
          'Memory Allocation',
          `[LOCAL VAR] Pushed 'x = 5' into add()'s stack frame at address ${xAddr}. Notice 'x' exists only inside add()'s scope.`,
          `ast-var-x-4`
        )
      );

      // Pop add() stack frame
      stackFrames.pop();
      if (stackFrames.length > 0) {
        stackFrames[stackFrames.length - 1].isCurrent = true;
      }
      currentStackPtr += 28; // reclaim

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[STACK POP] add() returned! Its stack frame and local variable 'x' were immediately popped and reclaimed. Control returned to main().`,
          `ast-func-add-3`
        )
      );
      continue;
    }

    // 9. Function Call: allocateResource(); (Memory leak demonstration)
    if (trimmed.includes('allocateResource();')) {
      const allocFrameAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 24;

      const allocFrame: StackFrame = {
        id: `frame-alloc-${steps.length}`,
        functionName: 'allocateResource',
        returnAddress: `0x${(TEXT_BASE + 0x64).toString(16).toUpperCase()} (main+24)`,
        basePointer: allocFrameAddr,
        stackPointer: `0x${currentStackPtr.toString(16).toUpperCase()}`,
        variables: [],
        isCurrent: true
      };

      stackFrames.forEach(f => (f.isCurrent = false));
      stackFrames.push(allocFrame);

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[FUNCTION CALL] allocateResource() called. Pushed stack frame at ${allocFrameAddr}.`,
          `ast-call-allocateResource-${lineNum}`
        )
      );

      // Body: int* p = new int(5);
      const heapAddr = `0x01${(currentHeapPtr & 0x00ffffff).toString(16).padStart(6, '0').toUpperCase()}`;
      currentHeapPtr += 16;
      const stackAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 8;

      heapBlocks.push({
        id: `heap-leak-${heapAddr}`,
        address: heapAddr,
        type: 'int',
        value: '5',
        sizeBytes: 4,
        allocatedAtLine: 4,
        allocatedByPointer: 'p',
        isFreed: false,
        isLeaked: false
      });

      allocFrame.variables.push({
        name: 'p',
        type: 'int*',
        value: heapAddr,
        address: stackAddr,
        sizeBytes: 8,
        scope: 'Local',
        status: 'created',
        isPointer: true,
        pointsToAddress: heapAddr
      });

      steps.push(
        createSnapshot(
          steps.length,
          4,
          'int* p = new int(5);',
          'Memory Allocation',
          `[HEAP ALLOCATION] Allocated 4 bytes on Heap at ${heapAddr}. Pointer 'p' stored in allocateResource()'s stack frame.`,
          `ast-ptr-p-4`
        )
      );

      // Exit allocateResource() WITHOUT delete p;
      stackFrames.pop();
      if (stackFrames.length > 0) {
        stackFrames[stackFrames.length - 1].isCurrent = true;
      }
      currentStackPtr += 32;

      // Pointer p is now destroyed, but heap block remains allocated!
      const leakedBlock = heapBlocks.find(h => h.address === heapAddr);
      if (leakedBlock) leakedBlock.isLeaked = true;

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Execution',
          `[MEMORY LEAK CRITICAL] allocateResource() finished. Its stack frame was destroyed, popping pointer 'p'. But 'delete p;' was NEVER called! Heap block at ${heapAddr} is now orphaned and LEAKED.`,
          `ast-func-allocateResource-3`
        )
      );
      continue;
    }

    // 10. Recursion: factorial(3);
    if (trimmed.includes('factorial(3)')) {
      // Simulate recursive push of 3, 2, 1
      const callArgs = [3, 2, 1];
      for (const arg of callArgs) {
        const fAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
        currentStackPtr -= 24;

        const frame: StackFrame = {
          id: `frame-fact-${arg}-${steps.length}`,
          functionName: `factorial(${arg})`,
          returnAddress: `0x${(TEXT_BASE + 0x30 + arg * 4).toString(16).toUpperCase()}`,
          basePointer: fAddr,
          stackPointer: `0x${currentStackPtr.toString(16).toUpperCase()}`,
          variables: [
            {
              name: 'n',
              type: 'int',
              value: `${arg}`,
              address: `0x${(currentStackPtr + 4).toString(16).toUpperCase()}`,
              sizeBytes: 4,
              scope: 'Local',
              status: 'created'
            }
          ],
          isCurrent: true
        };

        stackFrames.forEach(f => (f.isCurrent = false));
        stackFrames.push(frame);

        steps.push(
          createSnapshot(
            steps.length,
            4,
            `int factorial(int n = ${arg})`,
            'Memory Allocation',
            `[RECURSION PUSH] factorial(${arg}) pushed onto the Call Stack! New activation record with parameter n = ${arg}. Total stack frames: ${stackFrames.length}.`,
            `ast-func-factorial-3`
          )
        );
      }

      // Base case reached: factorial(1) returns 1
      steps.push(
        createSnapshot(
          steps.length,
          4,
          'if (n <= 1) return 1;',
          'Execution',
          `[BASE CASE REACHED] factorial(1) hits base condition 'n <= 1'. Returning value 1 and beginning call stack unwinding.`,
          `ast-ret-4`
        )
      );

      // Unwind factorial(1)
      stackFrames.pop();
      stackFrames[stackFrames.length - 1].isCurrent = true;
      steps.push(
        createSnapshot(
          steps.length,
          5,
          'return 1 * 2;',
          'Memory Allocation',
          `[STACK POP] factorial(1) popped. Returned 1 to factorial(2). Computing 2 * 1 = 2.`,
          `ast-ret-5`
        )
      );

      // Unwind factorial(2)
      stackFrames.pop();
      stackFrames[stackFrames.length - 1].isCurrent = true;
      steps.push(
        createSnapshot(
          steps.length,
          5,
          'return 2 * 3;',
          'Memory Allocation',
          `[STACK POP] factorial(2) popped. Returned 2 to factorial(3). Computing 3 * 2 = 6.`,
          `ast-ret-5`
        )
      );

      // Unwind factorial(3) to main
      stackFrames.pop();
      stackFrames[stackFrames.length - 1].isCurrent = true;

      // Assign result to res in main()
      const mainFrame = getActiveFrame();
      if (mainFrame) {
        const resAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
        currentStackPtr -= 4;
        mainFrame.variables.push({
          name: 'res',
          type: 'int',
          value: '6',
          address: resAddr,
          sizeBytes: 4,
          scope: 'Local',
          status: 'created'
        });
      }

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Execution',
          `[RECURSION COMPLETE] factorial(3) resolved to 6. Assigned 'res = 6' in main()'s stack frame. All recursive frames have successfully unwound!`,
          `ast-var-res-${lineNum}`
        )
      );
      continue;
    }

    // 10b. Object Instantiation: e.g. Graph g(5); or MyClass obj;
    const objDeclMatch = trimmed.match(/^([a-zA-Z_]\w*)\s+([a-zA-Z_]\w*)\s*(\(([^)]*)\))?\s*;/);
    if (objDeclMatch && !['int', 'float', 'double', 'char', 'bool', 'void', 'return', 'delete'].includes(objDeclMatch[1])) {
      const className = objDeclMatch[1];
      const objName = objDeclMatch[2];
      const args = objDeclMatch[4]?.trim() || '';

      const objAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 24;

      const heapAddr = `0x01${(currentHeapPtr & 0x00ffffff).toString(16).padStart(6, '0').toUpperCase()}`;
      currentHeapPtr += 32;

      heapBlocks.push({
        id: `heap-${objName}-${heapAddr}`,
        address: heapAddr,
        type: `${className}::adjList`,
        value: args ? `vector[${args}]` : 'vector[]',
        sizeBytes: 32,
        allocatedAtLine: lineNum,
        allocatedByPointer: objName,
        isFreed: false,
        isLeaked: false
      });

      const activeFrame = getActiveFrame();
      if (activeFrame) {
        activeFrame.variables.push({
          name: objName,
          type: className,
          value: `{ vertices: ${args || '0'}, heapBuf: ${heapAddr} }`,
          address: objAddr,
          sizeBytes: 24,
          scope: 'Local',
          status: 'created',
          isPointer: true,
          pointsToAddress: heapAddr
        });
      }

      symbolTable.push({
        name: objName,
        type: className,
        scope: 'Local',
        address: objAddr,
        sizeBytes: 24,
        value: `instance of ${className}(${args})`,
        status: 'created',
        frameName: activeFrame?.functionName
      });

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[CLASS INSTANTIATION] Created '${objName}' (instance of '${className}') on stack at ${objAddr}. Invoked constructor with argument '${args}'. Dynamic containers allocated on Heap at ${heapAddr}.`,
          `ast-obj-${objName}-${lineNum}`
        )
      );
      continue;
    }

    // 10c. Method calls on objects: obj.method(args);
    const methodCallMatch = trimmed.match(/^([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*;/);
    if (methodCallMatch) {
      const objName = methodCallMatch[1];
      const methodName = methodCallMatch[2];
      const callArgs = methodCallMatch[3].trim();

      const methodFrameAddr = `0x${currentStackPtr.toString(16).toUpperCase()}`;
      currentStackPtr -= 24;

      const methodFrame: StackFrame = {
        id: `frame-${methodName}-${steps.length}`,
        functionName: `${objName}.${methodName}(${callArgs})`,
        returnAddress: `0x${(TEXT_BASE + 0x50 + steps.length * 4).toString(16).toUpperCase()} (main)`,
        basePointer: methodFrameAddr,
        stackPointer: `0x${currentStackPtr.toString(16).toUpperCase()}`,
        variables: callArgs ? callArgs.split(',').map((arg, aIdx) => ({
          name: `arg${aIdx}`,
          type: 'int',
          value: arg.trim(),
          address: `0x${(currentStackPtr + 4 * (aIdx + 1)).toString(16).toUpperCase()}`,
          sizeBytes: 4,
          scope: 'Local',
          status: 'created'
        })) : [],
        isCurrent: true
      };

      stackFrames.forEach(f => (f.isCurrent = false));
      stackFrames.push(methodFrame);

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Execution',
          `[METHOD CALL] '${objName}.${methodName}(${callArgs})' called. Pushed activation record onto Call Stack at ${methodFrameAddr}.`,
          `ast-method-${methodName}-${lineNum}`
        )
      );

      // Pop method frame
      stackFrames.pop();
      if (stackFrames.length > 0) {
        stackFrames[stackFrames.length - 1].isCurrent = true;
      }
      currentStackPtr += 24;

      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Memory Allocation',
          `[METHOD RETURN] '${objName}.${methodName}()' completed and popped its activation frame. Control returned to main().`,
          `ast-method-ret-${methodName}-${lineNum}`
        )
      );
      continue;
    }

    // 10d. std::cout stream output
    if (trimmed.startsWith('std::cout') || trimmed.startsWith('cout')) {
      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Execution',
          `[I/O STREAM] Executed '${trimmed}'. Formatted text written to standard output buffer (stdout).`,
          `ast-io-${lineNum}`
        )
      );
      continue;
    }

    // 11. Return statement in main: return 0;
    if (trimmed.startsWith('return 0') || trimmed === 'return 0;') {
      steps.push(
        createSnapshot(
          steps.length,
          lineNum,
          trimmed,
          'Execution',
          `[PROGRAM TERMINATION] 'return 0;' executed. Main thread exits with code 0. OS reclaims main()'s stack frame and process address space.`,
          `ast-ret-${lineNum}`
        )
      );
      continue;
    }
  }

  // Update totalSteps on all snapshots
  const total = steps.length;
  steps.forEach(s => {
    s.totalSteps = total;
  });

  return steps;
}

function generatePseudoAssembly(line: string): string {
  if (line.includes('int globalVar = 100')) return 'mov DWORD PTR [0x00600000], 100';
  if (line.includes('int a = 10')) return 'mov DWORD PTR [rbp-4], 10';
  if (line.includes('int b = 20')) return 'mov DWORD PTR [rbp-8], 20';
  if (line.includes('int x = 5')) return 'mov DWORD PTR [rbp-4], 5';
  if (line.includes('add()')) return 'call add';
  if (line.includes('new int')) return 'call operator new';
  if (line.includes('delete')) return 'call operator delete';
  if (line.includes('&')) return 'lea rax, [rbp-4]';
  if (line.includes('*p =')) return 'mov DWORD PTR [rax], edx';
  if (line.includes('arr[')) return 'mov DWORD PTR [rbp-20+rax*4], edx';
  if (line.includes('factorial')) return 'call factorial';
  if (line.includes('return 0')) return 'xor eax, eax; ret';
  if (line.includes('return')) return 'ret';
  return 'nop';
}

export const simulateProgram = simulateExecution;
