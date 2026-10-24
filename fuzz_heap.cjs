const { FuzzedDataProvider } = require('@jazzer.js/core');
const RawHeap = require('./dist/heap.cjs');
const Heap = RawHeap.default || RawHeap;

function verifyHeapInvariants(heap, compare) {
  const data = heap.data;
  for (let i = 1; i < data.length; ++i) {
    const pi = (i - 1) >> 1;
    if (compare(data[i], data[pi]) < 0) {
      throw new Error(`Heap invariant violated at index ${i} (parent ${pi})`);
    }
  }
}

module.exports.fuzz = function(data) {
  const provider = new FuzzedDataProvider(data);

  const isMaxHeap = provider.consumeBoolean();
  const comparator = isMaxHeap
    ? (a, b) => b.priority - a.priority
    : (a, b) => a.priority - b.priority;
  const idGetter = (item) => item.id;

  const heap = new Heap(comparator, idGetter);
  const liveItems = [];
  let nextId = 1;

  const numOperations = provider.consumeIntegralInRange(1, 40);

  for (let i = 0; i < numOperations; i++) {
    const op = provider.consumeIntegralInRange(0, 10);

    switch (op) {
      case 0: {
        const item = {
          id: 'id_' + nextId++,
          priority: provider.consumeIntegralInRange(-10000, 10000)
        };
        heap.push(item);
        liveItems.push(item);
        break;
      }
      case 1: {
        const popped = heap.pop();
        if (popped !== undefined) {
          const idx = liveItems.indexOf(popped);
          if (idx !== -1) liveItems.splice(idx, 1);
        }
        break;
      }
      case 2: {
        const top = heap.top();
        const peek = heap.peek();
        if (top !== peek) {
          throw new Error('top() and peek() returned different items');
        }
        verifyHeapInvariants(heap, comparator);
        break;
      }
      case 3: {
        if (liveItems.length > 0 && provider.consumeBoolean()) {
          const target = provider.pickValue(liveItems);
          if (!heap.has(target.id) || heap.get(target.id) !== target) {
            throw new Error(`Expected live item ${target.id} to be found by has()/get()`);
          }
        } else {
          const missingId = 'missing_' + provider.consumeIntegralInRange(0, 100);
          if (heap.has(missingId) || heap.get(missingId) !== undefined) {
            throw new Error('Unexpected match for missing ID');
          }
        }
        break;
      }
      case 4: {
        if (liveItems.length > 0 && provider.consumeBoolean()) {
          const target = provider.pickValue(liveItems);
          target.priority = provider.consumeIntegralInRange(-10000, 10000);
          if (!heap.update(target)) {
            throw new Error('Expected update() on live item to return true');
          }
        } else {
          const fake = { id: 'missing_' + nextId, priority: 0 };
          if (heap.update(fake)) {
            throw new Error('Expected update() on missing item to return false');
          }
        }
        break;
      }
      case 5: {
        if (liveItems.length > 0 && provider.consumeBoolean()) {
          const idx = provider.consumeIntegralInRange(0, liveItems.length - 1);
          const target = liveItems[idx];
          liveItems.splice(idx, 1);
          if (!heap.delete(target)) {
            throw new Error('Expected delete() on live item to return true');
          }
        } else {
          const fake = { id: 'missing_' + nextId, priority: 0 };
          if (heap.delete(fake)) {
            throw new Error('Expected delete() on missing item to return false');
          }
        }
        break;
      }
      case 6: {
        heap.sort();
        verifyHeapInvariants(heap, comparator);
        break;
      }
      case 7: {
        const copy = heap.clone();
        if (copy.size !== heap.size || copy.isEmpty !== heap.isEmpty) {
          throw new Error('Cloned heap size/isEmpty mismatch');
        }
        break;
      }
      case 8: {
        const values = Array.from(heap);
        if (values.length !== liveItems.length) {
          throw new Error('Iterator count mismatch with liveItems');
        }
        break;
      }
      case 9: {
        if (liveItems.length > 0) {
          const fromHeap = Heap.from(liveItems, comparator, idGetter);
          verifyHeapInvariants(fromHeap, comparator);
        }
        break;
      }
      case 10: {
        heap.clear();
        liveItems.length = 0;
        if (!heap.isEmpty || heap.size !== 0) {
          throw new Error('Expected empty heap after clear()');
        }
        break;
      }
    }

    if (heap.size !== liveItems.length) {
      throw new Error(`Size mismatch: heap.size=${heap.size} vs liveItems=${liveItems.length}`);
    }
  }

  let prev = isMaxHeap ? Infinity : -Infinity;
  while (heap.size > 0) {
    const item = heap.pop();
    if (isMaxHeap ? item.priority > prev : item.priority < prev) {
      throw new Error(`Pop order violation: ${item.priority} after ${prev}`);
    }
    prev = item.priority;
  }
};
