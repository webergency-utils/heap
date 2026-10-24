import { describe, test, expect } from 'vitest';
import Heap from '../heap';

interface Item
{
    id  : string
    val : number
}

interface Task
{
    name     : string
    priority : number
}

interface NodeItem
{
    id       : number
    priority : number
}

describe( 'Heap tests', () =>
{
    test( 'should initialize an empty heap and return undefined on top(), peek(), pop(), and get()', () =>
    {
        const heap = new Heap<number>();

        expect( heap.size ).toBe( 0 );
        expect( heap.isEmpty ).toBe( true );
        expect( heap.top()).toBeUndefined();
        expect( heap.peek()).toBeUndefined();
        expect( heap.pop()).toBeUndefined();
        expect( heap.get( 1 )).toBeUndefined();
        expect( heap.has( 1 )).toBe( false );
        expect( heap.delete( 1 )).toBe( false );
        expect( heap.update( 1 )).toBe( false );
    });

    test( 'should maintain min-heap property by default including equal elements', () =>
    {
        const heap = new Heap<number>();
        heap.push( 5 ).push( 2 ).push( 8 ).push( 1 ).push( 3 ).push( 2 );

        expect( heap.size ).toBe( 6 );
        expect( heap.top()).toBe( 1 );

        const popped: number[] = [];

        while( heap.size > 0 )
        {
            popped.push( heap.pop()! );
        }

        expect( popped ).toStrictEqual([ 1, 2, 2, 3, 5, 8 ]);
    });

    test( 'should support a custom comparator (max-heap)', () =>
    {
        const heap = new Heap<number>(( a, b ) => b - a );
        heap.push( 5 ).push( 2 ).push( 8 ).push( 1 ).push( 3 );

        expect( heap.size ).toBe( 5 );
        expect( heap.top()).toBe( 8 );

        const popped: number[] = [];

        while( heap.size > 0 )
        {
            popped.push( heap.pop()! );
        }

        expect( popped ).toStrictEqual([ 8, 5, 3, 2, 1 ]);
    });

    test( 'should initialize from Array, Set, and Map using Heap.from()', () =>
    {
        const heapFromArray = Heap.from([ 10, 5, 20 ]);

        expect( heapFromArray.size ).toBe( 3 );
        expect( heapFromArray.pop()).toBe( 5 );
        expect( heapFromArray.pop()).toBe( 10 );
        expect( heapFromArray.pop()).toBe( 20 );

        const set = new Set([ 30, 15, 40 ]);
        const heapFromSet = Heap.from( set );

        expect( heapFromSet.size ).toBe( 3 );
        expect( heapFromSet.pop()).toBe( 15 );
        expect( heapFromSet.pop()).toBe( 30 );
        expect( heapFromSet.pop()).toBe( 40 );

        const map = new Map<string, number>([
            [ 'a', 50 ],
            [ 'b', 25 ],
            [ 'c', 75 ]
        ]);
        const heapFromMap = Heap.from( map );

        expect( heapFromMap.size ).toBe( 3 );
        expect( heapFromMap.pop()).toBe( 25 );
        expect( heapFromMap.pop()).toBe( 50 );
        expect( heapFromMap.pop()).toBe( 75 );
    });

    test( 'should correctly retrieve elements by ID and update index during push and pop', () =>
    {
        const heap = new Heap<Item, string>(
            ( a, b ) => a.val - b.val,
            ( item ) => item.id
        );

        const itemA = { id : 'a', val : 100 };
        const itemB = { id : 'b', val : 50 };
        const itemC = { id : 'c', val : 150 };

        heap.push( itemA );

        // Force index creation before subsequent pushes and pops
        expect( heap.get( 'a' )).toBe( itemA );
        expect( heap.get( 'missing' )).toBeUndefined();

        // Push smaller item while index is active so sift_up updates index
        heap.push( itemB ).push( itemC );

        expect( heap.get( 'b' )).toBe( itemB );
        expect( heap.get( 'a' )).toBe( itemA );
        expect( heap.get( 'c' )).toBe( itemC );

        // Pop while index is active with multiple elements
        expect( heap.pop()).toBe( itemB );
        expect( heap.has( 'b' )).toBe( false );
        expect( heap.get( 'a' )).toBe( itemA );

        // Pop remaining elements while index is active down to 1 and 0
        expect( heap.pop()).toBe( itemA );
        expect( heap.pop()).toBe( itemC );
        expect( heap.has( 'c' )).toBe( false );
    });

    test( 'should update items in-place or by replacement reference and re-sort properly', () =>
    {
        const heap = new Heap<Task, string>(
            ( a, b ) => a.priority - b.priority,
            ( t ) => t.name
        );

        const task1 = { name : 'Task 1', priority : 10 };
        const task2 = { name : 'Task 2', priority : 20 };
        const task3 = { name : 'Task 3', priority : 30 };

        heap.push( task1 ).push( task2 ).push( task3 );

        // Single-item update (size === 1) when only 1 element is in heap
        const singleHeap = new Heap<Task, string>(( a, b ) => a.priority - b.priority, t => t.name );
        const onlyTask = { name : 'Only', priority : 10 };
        singleHeap.push( onlyTask );
        onlyTask.priority = 5;
        singleHeap.update( onlyTask );

        expect( singleHeap.top()).toBe( onlyTask );

        // Priority update (decreased to make it highest priority)
        task3.priority = 5;
        const updated = heap.update( task3 );

        expect( updated ).toBe( true );
        expect( heap.top()).toBe( task3 );

        // Re-increase priority to be lowest priority
        task3.priority = 40;
        heap.update( task3 );

        expect( heap.top()).toBe( task1 );

        // Update using a new object reference with the same ID
        const task2Replacement = { name : 'Task 2', priority : 1 };
        expect( heap.update( task2Replacement )).toBe( true );
        expect( heap.top()).toBe( task2Replacement );

        // Attempting to update a task not in the heap
        const task4 = { name : 'Task 4', priority : 1 };
        expect( heap.update( task4 )).toBe( false );
    });

    test( 'should flush pending lazy updates when push() is called', () =>
    {
        const heap = new Heap<Item, string>(
            ( a, b ) => a.val - b.val,
            ( item ) => item.id
        );

        const a = { id : 'a', val : 10 };
        const b = { id : 'b', val : 20 };
        const c = { id : 'c', val : 30 };

        heap.push( a ).push( b ).push( c );

        // Mutate root a (index stays undefined) and push while index is undefined
        a.val = 25;
        heap.update( a );
        heap.push({ id : 'd', val : 5 });

        // Mutate b (builds index) and push while index is defined
        b.val = 1;
        heap.update( b );
        heap.push({ id : 'e', val : 15 });

        const popped: number[] = [];

        while( heap.size > 0 )
        {
            popped.push( heap.pop()!.val );
        }

        expect( popped ).toStrictEqual([ 1, 5, 15, 25, 30 ]);

        // Push enough items while unsorted to exceed threshold inside push()
        const thresholdHeap = new Heap<number>();
        thresholdHeap.push( 50 ).push( 60 );
        thresholdHeap.update( 50 );

        for( let i = 0; i < 11; ++i )
        {
            thresholdHeap.push( 40 - i );
        }

        expect( thresholdHeap.top()).toBe( 30 );
    });

    test( 'should handle deleting updated items including updated root without index crash', () =>
    {
        // Regression test: delete updated root when index is undefined
        const rootHeap = new Heap<Task, string>(
            ( a, b ) => a.priority - b.priority,
            ( t ) => t.name
        );
        const r1 = { name : 'R1', priority : 1 };
        const r2 = { name : 'R2', priority : 2 };
        rootHeap.push( r1 ).push( r2 );

        r1.priority = 10;
        rootHeap.update( r1 );

        expect( rootHeap.delete( r1 )).toBe( true );
        expect( rootHeap.size ).toBe( 1 );
        expect( rootHeap.top()).toBe( r2 );

        // Regression test: delete updated root when another item is also updated and index is undefined
        const rootMultiHeap = new Heap<Task, string>(
            ( a, b ) => a.priority - b.priority,
            ( t ) => t.name
        );
        const m1 = { name : 'M1', priority : 10 };
        const m2 = { name : 'M2', priority : 20 };
        const m3 = { name : 'M3', priority : 30 };
        rootMultiHeap.push( m1 ).push( m2 ).push( m3 );

        m2.priority = 5;
        rootMultiHeap.update( m2 );
        // Clear index to simulate unindexed state while unsorted
        ( rootMultiHeap as any ).index = undefined;
        m1.priority = 50;
        rootMultiHeap.update( m1 );

        expect( rootMultiHeap.delete( m1 )).toBe( true );
        expect( rootMultiHeap.pop()).toBe( m2 );
        expect( rootMultiHeap.pop()).toBe( m3 );
    });

    test( 'should handle deleting items while other lazy updates are pending and trigger threshold sort', () =>
    {
        const heap = new Heap<NodeItem, number>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );

        const items: NodeItem[] = [];

        for( let i = 0; i < 15; ++i )
        {
            const item = { id : i, priority : ( i + 1 ) * 10 };
            items.push( item );
            heap.push( item );
        }

        // Update 10 items (threshold is max(10, 1.5) = 10, so 10 updates stay lazy)
        for( let i = 0; i < 10; ++i )
        {
            items[i].priority = 1000 - i * 10;
            heap.update( items[i]);
        }

        // Delete an un-updated middle item so `last` is added to `updated`, exceeding threshold 10 -> triggers sort_updated()
        expect( heap.delete( items[10])).toBe( true );

        const popped: number[] = [];

        while( heap.size > 0 )
        {
            popped.push( heap.pop()!.priority );
        }

        for( let i = 1; i < popped.length; ++i )
        {
            expect( popped[i]).toBeGreaterThanOrEqual( popped[i - 1]);
        }
    });

    test( 'should handle deleting the last item while other lazy updates are pending without index', () =>
    {
        const heap = new Heap<NodeItem, number>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );

        const a = { id : 1, priority : 10 };
        const b = { id : 2, priority : 20 };
        const c = { id : 3, priority : 30 };
        heap.push( a ).push( b ).push( c );

        a.priority = 40;
        b.priority = 5;
        heap.update( a );
        heap.update( b );

        // Delete item while unsorted and index exists
        expect( heap.delete( b )).toBe( true );
        expect( heap.pop()).toBe( c );
        expect( heap.pop()).toBe( a );
    });

    test( 'should delete items correctly and handle duplicate primitive values', () =>
    {
        const heap = new Heap<number>();
        heap.push( 10 ).push( 20 ).push( 30 ).push( 40 ).push( 50 );

        // Delete last item in array
        expect( heap.delete( 50 )).toBe( true );
        expect( heap.size ).toBe( 4 );

        // Delete middle item
        expect( heap.delete( 30 )).toBe( true );
        expect( heap.size ).toBe( 3 );

        // Delete item that requires sift_up during delete
        const siftUpHeap = Heap.from([ 1, 10, 2, 20, 30, 3, 4 ]);
        expect( siftUpHeap.delete( 20 )).toBe( true );

        const siftUpPopped: number[] = [];

        while( siftUpHeap.size > 0 )
        {
            siftUpPopped.push( siftUpHeap.pop()! );
        }

        expect( siftUpPopped ).toStrictEqual([ 1, 2, 3, 4, 10, 30 ]);

        // Duplicate values with index active: delete and pop should not orphan remaining duplicates
        const dupHeap = new Heap<number>();
        dupHeap.push( 1 ).push( 5 ).push( 5 ).push( 10 );

        expect( dupHeap.has( 5 )).toBe( true );
        expect( dupHeap.delete( 5 )).toBe( true );
        expect( dupHeap.has( 5 )).toBe( true );
        expect( dupHeap.get( 5 )).toBe( 5 );
        expect( dupHeap.delete( 5 )).toBe( true );
        expect( dupHeap.has( 5 )).toBe( false );

        // Duplicate values with pop() when index is built
        const dupPopHeap = new Heap<number>();
        dupPopHeap.push( 5 ).push( 5 ).push( 10 );
        expect( dupPopHeap.has( 5 )).toBe( true );
        expect( dupPopHeap.pop()).toBe( 5 );
        expect( dupPopHeap.has( 5 )).toBe( true );
        expect( dupPopHeap.pop()).toBe( 5 );
        expect( dupPopHeap.has( 5 )).toBe( false );

        // Delete top item
        expect( heap.delete( 10 )).toBe( true );
        expect( heap.top()).toBe( 20 );

        // Delete non-existent item
        expect( heap.delete( 999 )).toBe( false );
    });

    test( 'should clear the heap', () =>
    {
        const heap = new Heap<number>();
        heap.push( 1 ).push( 2 ).push( 3 );

        expect( heap.size ).toBe( 3 );

        heap.clear();

        expect( heap.size ).toBe( 0 );
        expect( heap.top()).toBeUndefined();
    });

    test( 'should clone the heap both with and without an active index', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );

        // Clone without index
        const cloneWithoutIndex = heap.clone();

        expect( cloneWithoutIndex.size ).toBe( heap.size );
        expect( cloneWithoutIndex.top()).toBe( heap.top());

        // Populate index via has() then clone with index
        expect( heap.has( 3 )).toBe( true );

        const cloneWithIndex = heap.clone();

        expect( cloneWithIndex.has( 3 )).toBe( true );
        expect( cloneWithIndex.get( 4 )).toBe( 4 );

        cloneWithIndex.pop();

        expect( cloneWithIndex.size ).toBe( 2 );
        expect( heap.size ).toBe( 3 );
    });

    test( 'should sort the heap with and without index and handle duplicate IDs', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );

        expect( heap.top()).toBe( 1 );

        // Sort without index
        heap.sort();

        // Activate index with unique IDs and sort
        expect( heap.has( 3 )).toBe( true );
        heap.sort();

        expect( heap.top()).toBe( 1 );
        expect( heap.pop()).toBe( 1 );
        expect( heap.pop()).toBe( 3 );
        expect( heap.pop()).toBe( 4 );

        // Activate index with duplicate IDs and sort (should invalidate index)
        const dupHeap = new Heap<number>();
        dupHeap.push( 2 ).push( 2 ).push( 1 );

        expect( dupHeap.has( 2 )).toBe( true );
        dupHeap.sort();
        expect( dupHeap.pop()).toBe( 1 );
        expect( dupHeap.pop()).toBe( 2 );
        expect( dupHeap.pop()).toBe( 2 );
    });

    test( 'should iterate over values using values() and support direct Symbol.iterator', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );

        const values = Array.from( heap.values());

        expect( values.length ).toBe( 3 );
        expect( values ).toContain( 1 );
        expect( values ).toContain( 3 );
        expect( values ).toContain( 4 );

        const directValues = Array.from( heap );

        expect( directValues ).toStrictEqual( values );
    });

    test( 'should update multiple items at once and flush when exceeding threshold', () =>
    {
        const heap = new Heap<NodeItem, number>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );

        const items: NodeItem[] = [];

        for( let i = 0; i < 15; ++i )
        {
            const item = { id : i, priority : ( i + 1 ) * 10 };
            items.push( item );
            heap.push( item );
        }

        // Updating 11 items exceeds Math.max(10, 15 * 0.1) = 10 and triggers sort_updated() inside update()
        for( let i = 0; i < 11; ++i )
        {
            items[i].priority = 500 - i * 10;
            heap.update( items[i]);
        }

        // Also test pop() directly triggering sort_updated() when 2 items are updated
        items[0].priority = 1;
        items[1].priority = 2;
        heap.update( items[0]);
        heap.update( items[1]);

        expect( heap.pop()).toBe( items[0]);

        // Test two-pass incremental sort_updated() when heap size >= 64 and 2 <= updated.size <= (size >> 5)
        const largeHeap = new Heap<NodeItem, number>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );
        const largeItems: NodeItem[] = [];

        for( let i = 0; i < 80; ++i )
        {
            const item = { id : i, priority : ( i + 1 ) * 10 };
            largeItems.push( item );
            largeHeap.push( item );
        }

        // Update 2 items: one increases priority (sifts down), one decreases priority (sifts up)
        largeItems[0].priority = 9999;
        largeItems[70].priority = 1;
        largeHeap.update( largeItems[0]);
        largeHeap.update( largeItems[70]);

        expect( largeHeap.top()).toBe( largeItems[70]);
        expect( largeHeap.get( 0 )).toBe( largeItems[0]);
        expect( largeHeap.get( 70 )).toBe( largeItems[70]);

        // Test sort_updated() with duplicate IDs when index is active (invalidates index on full heapify)
        const dupUpdateHeap = new Heap<NodeItem, number>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );
        const d1 = { id : 1, priority : 10 };
        const d2 = { id : 1, priority : 20 };
        const d3 = { id : 2, priority : 30 };
        dupUpdateHeap.push( d1 ).push( d2 ).push( d3 );
        d1.priority = 50;
        d3.priority = 5;
        dupUpdateHeap.update( d1 );
        dupUpdateHeap.update( d3 );

        expect( dupUpdateHeap.top()).toBe( d3 );
    });

    test( 'should pass randomized property-based testing for mixed operations', () =>
    {
        const verifyHeapInvariants = ( heap: Heap<NodeItem, number> ) =>
        {
            const data = ( heap as any ).data as NodeItem[];

            for( let i = 1; i < data.length; ++i )
            {
                const parentIndex = ( i - 1 ) >> 1;

                if( data[parentIndex].priority > data[i].priority )
                {
                    return false;
                }
            }

            return true;
        };

        for( let run = 0; run < 100; ++run )
        {
            const heap = new Heap<NodeItem, number>(
                ( a, b ) => a.priority - b.priority,
                ( item ) => item.id
            );

            const items: NodeItem[] = [];

            for( let id = 0; id < 50; ++id )
            {
                const item = { id, priority : Math.floor( Math.random() * 1000 ) };
                items.push( item );
                heap.push( item );
            }

            expect( verifyHeapInvariants( heap )).toBe( true );

            const shuffled = [ ...items ].sort(() => Math.random() - 0.5 );
            const itemsToUpdate = shuffled.slice( 0, 15 );

            for( const item of itemsToUpdate )
            {
                item.priority = Math.floor( Math.random() * 1000 );
                heap.update( item );
            }

            heap.top();

            expect( verifyHeapInvariants( heap )).toBe( true );

            let lastPriority = -Infinity;

            while( heap.size > 0 )
            {
                const poppedItem = heap.pop()!;

                expect( poppedItem.priority ).toBeGreaterThanOrEqual( lastPriority );
                lastPriority = poppedItem.priority;
            }
        }
    });
});
