const { FuzzedDataProvider } = require('@jazzer.js/core');
const RawHeap = require('./dist/heap.cjs');
const Heap = RawHeap.default || RawHeap;

function createFuzzedItem(provider, depth = 0) {
  if (depth > 3) return provider.consumeString(10);
  const type = provider.consumeIntegralInRange(0, 5);
  switch (type) {
    case 0:
      return {
        id: provider.consumeString(10),
        val: provider.consumeNumber(),
        active: provider.consumeBoolean()
      };
    case 1:
      return provider.consumeString(20);
    case 2:
      return provider.consumeNumber();
    case 3:
      return provider.consumeBoolean();
    case 4:
      return [provider.consumeString(5), provider.consumeNumber()];
    default:
      return { id: provider.consumeString(5), child: createFuzzedItem(provider, depth + 1) };
  }
}

module.exports.fuzz = function(data) {
  try {
    const provider = new FuzzedDataProvider(data);
    
    const useComparator = provider.consumeBoolean();
    const comparator = useComparator
      ? (a, b) => {
          if (typeof a === 'number' && typeof b === 'number') return a - b;
          return String(a).localeCompare(String(b));
        }
      : undefined;

    const idGetter = (item) => {
      if (item && typeof item === 'object' && item !== null && 'id' in item) {
        return item.id;
      }
      return item;
    };

    const heap = new Heap(comparator, idGetter);

    const numOperations = provider.consumeIntegralInRange(1, 25);
    const items = [];

    for (let i = 0; i < numOperations; i++) {
      const op = provider.consumeIntegralInRange(0, 10);
      const item = createFuzzedItem(provider);

      switch (op) {
        case 0:
          heap.push(item);
          items.push(item);
          break;
        case 1:
          heap.pop();
          break;
        case 2:
          heap.peek();
          heap.top();
          break;
        case 3: {
          const id = idGetter(item);
          heap.has(id);
          heap.get(id);
          break;
        }
        case 4:
          heap.update(item);
          break;
        case 5:
          heap.delete(item);
          break;
        case 6:
          heap.sort();
          break;
        case 7: {
          const copy = heap.clone();
          copy.size;
          copy.isEmpty;
          break;
        }
        case 8:
          for (const v of heap.values()) {
            // iterate
          }
          break;
        case 9:
          if (items.length > 0) {
            Heap.from(items, comparator, idGetter);
          }
          break;
        case 10:
          heap.clear();
          break;
      }
    }
  } catch (e) {
    if (e instanceof RangeError || e instanceof TypeError) {
      return;
    }
    throw e;
  }
};
