export interface QuizQuestion {
  id: string;
  title: string;
  category: 'Stack vs Heap' | 'Pointers' | 'Scope' | 'Memory Leaks' | 'Recursion';
  question: string;
  codeSnippet: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    title: 'Pointer Storage vs Dereferenced Target',
    category: 'Pointers',
    question: 'In the code below, where is pointer variable `p` stored, and where is the integer value `50` stored?',
    codeSnippet: `int main() {
    int* p = new int(50);
    return 0;
}`,
    options: [
      'Both p and 50 are stored on the Stack.',
      'Both p and 50 are stored on the Heap.',
      'p is stored on the Stack; 50 is stored on the Heap.',
      'p is stored on the Heap; 50 is stored on the Stack.'
    ],
    correctIndex: 2,
    explanation:
      "Correct! Pointer variable 'p' is a local variable declared inside main(), so its 8-byte pointer value resides in main()'s Stack frame. The memory block created by 'new int(50)' is allocated dynamically by the operating system in the Heap segment."
  },
  {
    id: 'q2',
    title: 'Memory Leak Identification',
    category: 'Memory Leaks',
    question: 'Which of the following code snippets results in a Memory Leak?',
    codeSnippet: `// Option A:
void f1() { int x = 10; }

// Option B:
void f2() { int* p = new int(100); }

// Option C:
void f3() { int* p = new int(100); delete p; }

// Option D:
int globalVal = 50;`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctIndex: 1,
    explanation:
      "Correct! In Option B, 'new int(100)' allocates 4 bytes on the Heap. When f2() returns, pointer 'p' is popped from the Stack, losing the only reference to the heap block. Because 'delete p' was never invoked, the memory remains allocated and unreachable — a classic Memory Leak."
  },
  {
    id: 'q3',
    title: 'Variable Lifetime & Data Segment',
    category: 'Scope',
    question: 'Where is `count` stored, and when is it destroyed?',
    codeSnippet: `static int count = 0;

void increment() {
    count++;
}`,
    options: [
      'Stored on the Stack; destroyed when increment() returns.',
      'Stored on the Heap; destroyed when delete is called.',
      'Stored in the Data/BSS Segment; destroyed only when the program terminates.',
      'Stored in the Text Segment; read-only and never destroyed.'
    ],
    correctIndex: 2,
    explanation:
      'Correct! Static and global variables are allocated in the permanent Data Segment (or BSS if zero-initialized) at fixed virtual addresses. They persist throughout the entire execution duration of the program.'
  },
  {
    id: 'q4',
    title: 'Recursive Call Stack Frames',
    category: 'Recursion',
    question: 'During the execution of `factorial(3)`, what is the maximum number of Stack Frames active concurrently on the Call Stack?',
    codeSnippet: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
int main() {
    factorial(3);
    return 0;
}`,
    options: ['1 Frame', '3 Frames', '4 Frames (main + 3 factorial)', '6 Frames'],
    correctIndex: 2,
    explanation:
      'Correct! At maximum depth when n = 1 is reached, the Call Stack holds: main() -> factorial(3) -> factorial(2) -> factorial(1). That equals 4 concurrent activation records before unwinding begins.'
  },
  {
    id: 'q5',
    title: 'Array Address Calculation',
    category: 'Stack vs Heap',
    question: 'If `int arr[5]` has a base address of `0x7FFE82E0` on a 64-bit system, what is the memory address of `arr[3]`? (Assume `sizeof(int) == 4`)',
    codeSnippet: `int arr[5] = {10, 20, 30, 40, 50};`,
    options: ['0x7FFE82E3', '0x7FFE82EC', '0x7FFE82E8', '0x7FFE82F0'],
    correctIndex: 1,
    explanation:
      'Correct! In C/C++, arrays are contiguous. Address of arr[i] = base + (i * sizeof(int)). Here, 0x7FFE82E0 + (3 * 4) = 0x7FFE82E0 + 12 (which in hex is 0xC) = 0x7FFE82EC.'
  }
];
