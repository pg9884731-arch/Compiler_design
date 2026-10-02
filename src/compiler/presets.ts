import { PresetProgram } from './types';

export const PRESETS: PresetProgram[] = [
  {
    id: 'global-local',
    title: '1. Global & Local Variables',
    tagline: 'Text Segment vs Data Segment vs Stack Allocation',
    concept: 'Memory Segments & Scopes',
    difficulty: 'Beginner',
    code: `#include<iostream>
using namespace std;

int globalVar = 100;

int main(){
    int a = 10;
    int b = 20;

    return 0;
}`,
    explanation:
      'Demonstrates the fundamental difference between Global Variables stored in the static Data Segment (fixed lifetime) and Local Variables pushed onto the Stack frame (temporary lifetime).',
    takeaway:
      'globalVar stays in the Data Segment throughout execution, while a and b exist strictly inside main() on the Stack.'
  },
  {
    id: 'function-call',
    title: '2. Function Calls & Activation Records',
    tagline: 'Watch Stack Frames Push and Pop in Real-Time',
    concept: 'Call Stack & Stack Frames',
    difficulty: 'Beginner',
    code: `#include<iostream>
using namespace std;

void add(){
    int x = 5;
}

int main(){
    int a = 10;
    add();
    int b = 20;

    return 0;
}`,
    explanation:
      'When main() calls add(), the CPU pushes a new Activation Record (Stack Frame) with return address and local variable x. When add() returns, its frame is immediately popped and reclaimed.',
    takeaway:
      'Stack frames grow downward during calls and shrink when returning. Variables outside the current frame cannot be accessed.'
  },
  {
    id: 'pointers',
    title: '3. Pointers & Address-Of Operator',
    tagline: 'Animated Reference Arrows Linking Stack Addresses',
    concept: 'Pointers & Dereferencing',
    difficulty: 'Intermediate',
    code: `#include<iostream>
using namespace std;

int main(){
    int x = 10;
    int* p = &x;
    *p = 42;

    return 0;
}`,
    explanation:
      'Variable x occupies address 0x7FFE82F0. Pointer variable p stores that memory address. Dereferencing *p mutates x directly through its memory pointer.',
    takeaway:
      'A pointer does not hold the actual value, but rather the memory location where that value resides.'
  },
  {
    id: 'dynamic-memory',
    title: '4. Dynamic Memory (Heap Allocation)',
    tagline: 'Allocating and Deallocating on the Heap with new and delete',
    concept: 'Heap Management & Life Cycle',
    difficulty: 'Intermediate',
    code: `#include<iostream>
using namespace std;

int main(){
    int* p = new int(50);
    *p = 75;
    delete p;

    return 0;
}`,
    explanation:
      'new allocates 4 bytes dynamically on the Heap at address 0x01002A10. Pointer p lives on the Stack and points across memory boundaries to the Heap. delete frees the block.',
    takeaway:
      'Heap memory persists independently of function returns until explicitly freed with delete or free().'
  },
  {
    id: 'arrays',
    title: '5. Arrays & Contiguous Memory',
    tagline: 'Contiguous Index Blocks and Memory Offset Mathematics',
    concept: 'Contiguous Memory & Indexing',
    difficulty: 'Beginner',
    code: `#include<iostream>
using namespace std;

int main(){
    int arr[5] = {1, 2, 3, 4, 5};
    arr[2] = 99;

    return 0;
}`,
    explanation:
      'Arrays allocate contiguous sequential memory slots on the Stack. Element arr[i] is accessed in O(1) time via base_address + (i * sizeof(int)).',
    takeaway:
      'arr[0] through arr[4] are positioned exactly 4 bytes apart in memory without any gaps.'
  },
  {
    id: 'recursion',
    title: '6. Recursion (Stack Explosion)',
    tagline: 'Step Through Factorial Call Stack Frames & Unwinding',
    concept: 'Recursive Call Stack Frames',
    difficulty: 'Advanced',
    code: `#include<iostream>
using namespace std;

int factorial(int n){
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main(){
    int res = factorial(3);
    return 0;
}`,
    explanation:
      'Watch 4 separate stack frames stack up on top of each other: main() -> factorial(3) -> factorial(2) -> factorial(1). Once the base case returns, frames resolve and vanish sequentially.',
    takeaway:
      'Each recursive invocation creates a complete, independent copy of parameters and local state on the stack.'
  },
  {
    id: 'memory-leak',
    title: '7. Memory Leak Detection (Warning Alert)',
    tagline: 'Automatic Detection of Unreleased Heap Allocations',
    concept: 'Memory Safety & Diagnostics',
    difficulty: 'Intermediate',
    code: `#include<iostream>
using namespace std;

void allocateResource(){
    int* p = new int(5);
    // Missing delete p!
}

int main(){
    allocateResource();
    int status = 1;
    return 0;
}`,
    explanation:
      'The function allocateResource() exits without freeing the heap memory allocated by new. When pointer p goes out of scope, the heap block remains allocated with no way to reach it — creating a Memory Leak.',
    takeaway:
      'Always pair every new with a corresponding delete (or use smart pointers like std::unique_ptr) to prevent leaks.'
  }
];
