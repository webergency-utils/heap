# @webergency-utils/heap

[![npm version](https://img.shields.io/npm/v/%40webergency-utils%2Fheap)](https://www.npmjs.com/package/@webergency-utils/heap)
[![npm downloads](https://img.shields.io/npm/dm/%40webergency-utils%2Fheap)](https://www.npmjs.com/package/@webergency-utils/heap)
[![License](https://img.shields.io/npm/l/%40webergency-utils%2Fheap)](https://www.npmjs.com/package/@webergency-utils/heap)

A high-performance, type-safe Binary Heap implementation for TypeScript and Node.js. It features default min-heap and customizable max-heap sorting, static construction from JavaScript collections, key-based indexing for fast arbitrary element lookups, and lazy update/deletion capabilities.

## TL;DR

```typescript
import Heap from '@webergency-utils/heap';

interface Task {
  id: string;
  priority: number;
}

// Initialize a min-heap sorted by priority, using task IDs for indexing
const heap = new Heap<Task, string>(
  (a, b) => a.priority - b.priority,
  (task) => task.id
);

// Push items
heap.push({ id: 'cleanup', priority: 10 });
heap.push({ id: 'hotfix', priority: 1 });
heap.push({ id: 'feature', priority: 5 });

// Peek top item
console.log(heap.peek()); // { id: 'hotfix', priority: 1 }

// Check if heap contains task by ID
console.log(heap.has('cleanup')); // true

// Retrieve an item by ID
console.log(heap.get('feature')); // { id: 'feature', priority: 5 }

// Pop items
console.log(heap.pop());  // { id: 'hotfix', priority: 1 }
console.log(heap.size);   // 2
```

## Installation & Setup

Install the package via npm:

```bash
npm install @webergency-utils/heap
```

No external peer dependencies, configuration, or environment variables are required.

## Architecture & Internals

The library provides a classic binary heap structured on a flat, dynamically-resized array. Element sifting (`sift_up`, `sift_down`) runs in $O(\log n)$ time.

### Key Indexing

To overcome the traditional $O(n)$ search complexity of heaps, `Heap` maintains an internal `Map<I, number>` map index. This map coordinates the unique identifier of an element (derived using the user-provided `id_getter` function) to its current index in the internal array. This index allows:
- $O(1)$ lookups via [get](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L189) and [has](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L204).
- $O(\log n)$ updates via [update](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L225) and deletions via [delete](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L245) of arbitrary elements.

The map index is lazily initialized when retrieval/modification methods are called for the first time.

### Lazy Updates

When elements are modified in-place externally and updated via [update](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L225), sifting is deferred:
1. The heap flags itself as unsorted and inserts the item into an internal `updated` set.
2. If multiple items are updated sequentially, no immediate sorting occurs.
3. Sorting/sifting is performed lazily when [top](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L132) or [pop](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L158) is called, or when the count of updated items exceeds `10` and `10%` of the total heap size.

This makes batch updates of properties highly efficient by avoiding duplicate sifts.

## Glossary

- [Heap](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L3): The main binary heap class.
- [size](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L122): Public getter returning the number of elements in the heap.
- [isEmpty](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L127): Public getter indicating if the heap has no elements.
- [top()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L132) / [peek()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L142): Retrieve the root element without removing it.
- [push(item)](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L147): Insert an element into the heap.
- [pop()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L158): Remove and return the root element.
- [get(id)](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L189): Retrieve an element by its unique identifier.
- [has(id)](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L204): Verify if an element exists by its ID.
- [update(item)](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L225): Submit an updated element for deferred sorting.
- [delete(item)](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L245): Remove an arbitrary element from the heap.
- [clear()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L280): Clear all items from the heap.
- [clone()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L290): Create a shallow copy of the heap.
- [sort()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L328): Explicitly trigger heap-sorting of elements in-place.
- [values()](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L215) / [[Symbol.iterator]](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L220): Return an iterator over the underlying data array.

## API Reference

### class Heap\<T, I = T\>

The main class representing the binary heap.

#### Generics

- `T`: The type of items stored in the heap.
- `I`: The type of unique ID used for key indexing. Defaults to `T`.

#### Constructor

```typescript
constructor(comparator?: Comparator<T>, id_getter?: (item: T) => I)
```

Creates a new, empty heap.

- **Parameters**:
  - `comparator` (optional): A function of type `(a: T, b: T) => number`. If returning negative, `a` sorts before `b`. If omitted, default comparison `a < b ? -1 : (a > b ? 1 : 0)` is used (Min-Heap behavior).
  - `id_getter` (optional): A function of type `(item: T) => I`. Used to retrieve a unique ID for indexing. If omitted, defaults to casting `item` directly to `I`.

##### Example

```typescript
// Custom Max-Heap constructor for objects
const maxHeap = new Heap<{ id: string; val: number }, string>(
  (a, b) => b.val - a.val,
  (item) => item.id
);
```

---

#### Static Methods

##### Heap.from

```typescript
static from<T, I>(
  container: Array<T> | Set<T> | Map<any, T>,
  comparator?: Comparator<T>,
  id_getter?: (item: T) => I
): Heap<T, I>
```

Initializes a heap populated with elements from an Array, Set, or Map. Invariants are restored in $O(n)$ time using Floyd's heapify algorithm.

- **Parameters**:
  - `container`: The collection of items to import.
  - `comparator` (optional): Comparison function.
  - `id_getter` (optional): Key-retrieval function.
- **Returns**: A new, heapified [Heap](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L3) instance.

##### Example

```typescript
const numbers = new Set([45, 12, 89]);
const minHeap = Heap.from(numbers);
console.log(minHeap.pop()); // 12
```

---

#### Properties

##### size

```typescript
get size(): number
```

Returns the current number of elements in the heap.

##### isEmpty

```typescript
get isEmpty(): boolean
```

Returns `true` if the heap is empty, otherwise `false`.

---

#### Instance Methods

##### push

```typescript
push(item: T): this
```

Inserts a new element into the heap.

- **Parameters**:
  - `item`: The element to insert.
- **Returns**: The current `Heap` instance for method chaining.

##### Example

```typescript
heap.push(10).push(20).push(3);
```

##### pop

```typescript
pop(): T | void
```

Removes and returns the root element (the minimum element in a min-heap or maximum in a max-heap).

- **Returns**: The root element, or `undefined` if the heap is empty.

##### Example

```typescript
const lowest = heap.pop();
```

##### top / peek

```typescript
top(): T | void
peek(): T | void
```

Returns the root element without removing it. Note that `peek()` is an alias for `top()`.

- **Returns**: The root element, or `undefined` if the heap is empty.

##### get

```typescript
get(id: I): T | void
```

Retrieves an element by its identifier.

- **Parameters**:
  - `id`: The unique key of the element.
- **Returns**: The matching element, or `undefined` if it does not exist.

##### has

```typescript
has(id: I): boolean
```

Checks if an element with the given identifier exists in the heap.

- **Parameters**:
  - `id`: The unique key of the element.
- **Returns**: `true` if the element exists, otherwise `false`.

##### update

```typescript
update(item: T): boolean
```

Marks an element as updated when its value or priority changes. If the item exists, it is marked for deferred sorting (lazy heapification).

- **Parameters**:
  - `item`: The element to update.
- **Returns**: `true` if the item exists in the heap and was updated, otherwise `false`.

##### Example

```typescript
const task = heap.get('task-a');
if (task) {
  task.priority = 1; // Change priority
  heap.update(task); // Notify heap
}
```

##### delete

```typescript
delete(item: T): boolean
```

Removes a specific element from the heap.

- **Parameters**:
  - `item`: The element to delete.
- **Returns**: `true` if the element was successfully deleted, otherwise `false`.

##### Example

```typescript
const deleted = heap.delete(task);
```

##### clear

```typescript
clear(): this
```

Removes all elements from the heap.

- **Returns**: The current `Heap` instance.

##### clone

```typescript
clone(): Heap<T, I>
```

Creates a shallow copy of the heap (with duplicated internal arrays, indices, and states).

- **Returns**: A new [Heap](file:///Users/tomaskorenko/Projects/Github/webergency-utils/heap/src/heap.ts#L3) instance.

##### sort

```typescript
sort(): this
```

Forces an immediate in-place heapification of all elements, flushing any pending lazy updates.

- **Returns**: The current `Heap` instance.

##### values

```typescript
values(): IterableIterator<T>
```

Returns an iterator over the underlying data array. Note that elements are returned in internal array order and are not guaranteed to be sorted.

##### Symbol.iterator

```typescript
[Symbol.iterator](): IterableIterator<T>
```

Allows direct iteration over the heap (e.g. in `for...of` loops). Behaves identically to `values()`.

##### Example

```typescript
for (const item of heap) {
  console.log(item);
}
```
