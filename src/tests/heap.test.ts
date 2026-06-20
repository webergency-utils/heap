import { describe, test, expect } from 'vitest';
import Heap from '../heap';

describe( 'Heap tests', () =>
{
    test( 'should initialize an empty heap and return undefined on top() and pop()', () =>
    {
        const heap = new Heap<number>();
        expect( heap.size ).toBe( 0 );
        expect( heap.top() ).toBeUndefined();
        expect( heap.pop() ).toBeUndefined();
    });

    test( 'should maintain min-heap property by default', () =>
    {
        const heap = new Heap<number>();
        heap.push( 5 ).push( 2 ).push( 8 ).push( 1 ).push( 3 );

        expect( heap.size ).toBe( 5 );
        expect( heap.top() ).toBe( 1 );

        const popped: number[] = [];
        while( heap.size > 0 )
        {
            popped.push( heap.pop() as number );
        }

        expect( popped ).toStrictEqual([ 1, 2, 3, 5, 8 ]);
    });

    test( 'should support a custom comparator (max-heap)', () =>
    {
        const heap = new Heap<number>( ( a, b ) => b - a );
        heap.push( 5 ).push( 2 ).push( 8 ).push( 1 ).push( 3 );

        expect( heap.size ).toBe( 5 );
        expect( heap.top() ).toBe( 8 );

        const popped: number[] = [];
        while( heap.size > 0 )
        {
            popped.push( heap.pop() as number );
        }

        expect( popped ).toStrictEqual([ 8, 5, 3, 2, 1 ]);
    });

    test( 'should initialize from Array, Set, and Map using Heap.from()', () =>
    {
        // From Array
        const heapFromArray = Heap.from([ 10, 5, 20 ]);
        expect( heapFromArray.size ).toBe( 3 );
        expect( heapFromArray.pop() ).toBe( 5 );
        expect( heapFromArray.pop() ).toBe( 10 );
        expect( heapFromArray.pop() ).toBe( 20 );

        // From Set
        const set = new Set([ 30, 15, 40 ]);
        const heapFromSet = Heap.from( set );
        expect( heapFromSet.size ).toBe( 3 );
        expect( heapFromSet.pop() ).toBe( 15 );
        expect( heapFromSet.pop() ).toBe( 30 );
        expect( heapFromSet.pop() ).toBe( 40 );

        // From Map
        const map = new Map<string, number>([
            [ 'a', 50 ],
            [ 'b', 25 ],
            [ 'c', 75 ]
        ]);
        const heapFromMap = Heap.from( map );
        expect( heapFromMap.size ).toBe( 3 );
        expect( heapFromMap.pop() ).toBe( 25 );
        expect( heapFromMap.pop() ).toBe( 50 );
        expect( heapFromMap.pop() ).toBe( 75 );
    });

    test( 'should correctly retrieve elements by ID using custom id_getter', () =>
    {
        interface Item { id: string; val: number }
        const heap = new Heap<Item, string>(
            ( a, b ) => a.val - b.val,
            ( item ) => item.id
        );

        const itemA = { id: 'a', val: 100 };
        const itemB = { id: 'b', val: 50 };
        const itemC = { id: 'c', val: 150 };

        heap.push( itemA ).push( itemB ).push( itemC );

        expect( heap.get( 'b' ) ).toBe( itemB );
        expect( heap.get( 'a' ) ).toBe( itemA );
        expect( heap.get( 'c' ) ).toBe( itemC );
        expect( heap.get( 'd' ) ).toBeUndefined();
    });

    test( 'should update items and re-sort properly', () =>
    {
        interface Task { name: string; priority: number }
        const heap = new Heap<Task, string>(
            ( a, b ) => a.priority - b.priority,
            ( t ) => t.name
        );

        const task1 = { name: 'Task 1', priority: 10 };
        const task2 = { name: 'Task 2', priority: 20 };
        const task3 = { name: 'Task 3', priority: 30 };

        heap.push( task1 ).push( task2 ).push( task3 );

        // Priority update (decreased to make it highest priority)
        task3.priority = 5;
        const updated = heap.update( task3 );
        expect( updated ).toBe( true );

        // Top should now be task3
        expect( heap.top() ).toBe( task3 );

        // Re-increase priority to be lowest priority
        task3.priority = 40;
        heap.update( task3 );

        // Top should be task1
        expect( heap.top() ).toBe( task1 );

        // Attempting to update a task not in the heap
        const task4 = { name: 'Task 4', priority: 1 };
        expect( heap.update( task4 ) ).toBe( false );
    });

    test( 'should handle deleting updated items correctly', () =>
    {
        interface Task { name: string; priority: number }
        const heap = new Heap<Task, string>(
            ( a, b ) => a.priority - b.priority,
            ( t ) => t.name
        );

        const task1 = { name: 'Task 1', priority: 10 };
        const task2 = { name: 'Task 2', priority: 20 };
        const task3 = { name: 'Task 3', priority: 30 };

        heap.push( task1 ).push( task2 ).push( task3 );

        // Update task3 priority to 5 (needs to go to top)
        task3.priority = 5;
        heap.update( task3 );

        // Delete task3 before it is sorted/sifted
        expect( heap.delete( task3 ) ).toBe( true );

        // Verify heap size and contents
        expect( heap.size ).toBe( 2 );
        expect( heap.pop() ).toBe( task1 );
        expect( heap.pop() ).toBe( task2 );
    });

    test( 'should delete items correctly and maintain heap property', () =>
    {
        const heap = new Heap<number>();
        heap.push( 10 ).push( 20 ).push( 30 ).push( 40 ).push( 50 );

        // Delete middle item
        let deleted = heap.delete( 30 );
        expect( deleted ).toBe( true );
        expect( heap.size ).toBe( 4 );

        // Verify ordering remains intact
        expect( heap.pop() ).toBe( 10 );
        expect( heap.pop() ).toBe( 20 );
        expect( heap.pop() ).toBe( 40 );
        expect( heap.pop() ).toBe( 50 );

        // Delete top item
        heap.push( 10 ).push( 20 ).push( 30 );
        expect( heap.delete( 10 ) ).toBe( true );
        expect( heap.top() ).toBe( 20 );

        // Delete non-existent item
        expect( heap.delete( 999 ) ).toBe( false );
    });

    test( 'should clear the heap', () =>
    {
        const heap = new Heap<number>();
        heap.push( 1 ).push( 2 ).push( 3 );
        expect( heap.size ).toBe( 3 );

        heap.clear();
        expect( heap.size ).toBe( 0 );
        expect( heap.top() ).toBeUndefined();
    });

    test( 'should check isEmpty and peek() correctly', () =>
    {
        const heap = new Heap<number>();
        expect( heap.isEmpty ).toBe( true );
        expect( heap.peek() ).toBeUndefined();

        heap.push( 10 );
        expect( heap.isEmpty ).toBe( false );
        expect( heap.peek() ).toBe( 10 );
    });

    test( 'should clone the heap correctly', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );

        const clone = heap.clone();
        expect( clone.size ).toBe( heap.size );
        expect( clone.top() ).toBe( heap.top() );

        // Modify the clone and verify original remains unchanged
        clone.pop();
        expect( clone.size ).toBe( 2 );
        expect( heap.size ).toBe( 3 );
    });

    test( 'should sort the heap', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );
        expect( heap.top() ).toBe( 1 );

        heap.sort();
        expect( heap.top() ).toBe( 1 );
        expect( heap.pop() ).toBe( 1 );
        expect( heap.pop() ).toBe( 3 );
        expect( heap.pop() ).toBe( 4 );
    });

    test( 'should iterate over values using values() and support direct Symbol.iterator', () =>
    {
        const heap = new Heap<number>();
        heap.push( 3 ).push( 1 ).push( 4 );

        const values = Array.from( heap.values() );
        expect( values.length ).toBe( 3 );
        expect( values ).toContain( 1 );
        expect( values ).toContain( 3 );
        expect( values ).toContain( 4 );

        // Direct iteration
        const directValues = Array.from( heap );
        expect( directValues ).toStrictEqual( values );
    });

    test( 'should check for item existence using has()', () =>
    {
        interface Item { id: string; val: number }
        const heap = new Heap<Item, string>(
            ( a, b ) => a.val - b.val,
            ( item ) => item.id
        );

        const itemA = { id: 'a', val: 100 };
        const itemB = { id: 'b', val: 50 };

        expect( heap.has( 'a' ) ).toBe( false );

        heap.push( itemA );
        expect( heap.has( 'a' ) ).toBe( true );
        expect( heap.has( 'b' ) ).toBe( false );

        heap.push( itemB );
        expect( heap.has( 'b' ) ).toBe( true );

        heap.delete( itemA );
        expect( heap.has( 'a' ) ).toBe( false );
        expect( heap.has( 'b' ) ).toBe( true );
    });

    test( 'should update multiple items at once and correctly restore heap order', () =>
    {
        interface Item { id: string; priority: number }
        const heap = new Heap<Item, string>(
            ( a, b ) => a.priority - b.priority,
            ( item ) => item.id
        );

        const itemA = { id: 'A', priority: 10 };
        const itemB = { id: 'B', priority: 20 };
        const itemC = { id: 'C', priority: 30 };
        const itemD = { id: 'D', priority: 40 };
        const itemE = { id: 'E', priority: 50 };

        heap.push( itemA ).push( itemB ).push( itemC ).push( itemD ).push( itemE );

        // Update multiple priorities
        itemE.priority = 5;  // E should go to the top (was 50)
        itemA.priority = 25; // A should go down (was 10)
        itemC.priority = 15; // C should go up (was 30)

        heap.update( itemE );
        heap.update( itemA );
        heap.update( itemC );

        const popped: Item[] = [];
        while( heap.size > 0 )
        {
            popped.push( heap.pop() as Item );
        }

        expect( popped ).toStrictEqual([ itemE, itemC, itemB, itemA, itemD ]);
    });

    test( 'should pass randomized property-based testing for multiple updates', () =>
    {
        interface Node { id: number; priority: number }
        
        // Helper to check if heap invariants hold
        const verifyHeapInvariants = ( heap: Heap<Node, number> ) =>
        {
            const data = ( heap as any ).data as Node[];
            for( let i = 1; i < data.length; ++i )
            {
                const parentIndex = ( i - 1 ) >> 1;
                // Min-heap: parent priority <= child priority
                if( data[parentIndex].priority > data[i].priority )
                {
                    return false;
                }
            }
            return true;
        };

        for( let run = 0; run < 100; ++run )
        {
            const heap = new Heap<Node, number>(
                ( a, b ) => a.priority - b.priority,
                ( item ) => item.id
            );

            // 1. Insert 50 items with unique IDs and random priorities
            const items: Node[] = [];
            for( let id = 0; id < 50; ++id )
            {
                const item = { id, priority: Math.floor( Math.random() * 1000 ) };
                items.push( item );
                heap.push( item );
            }

            expect( verifyHeapInvariants( heap ) ).toBe( true );

            // 2. Select 15 random items and update their priorities
            const shuffled = [ ...items ].sort( () => Math.random() - 0.5 );
            const itemsToUpdate = shuffled.slice( 0, 15 );

            for( const item of itemsToUpdate )
            {
                item.priority = Math.floor( Math.random() * 1000 );
                heap.update( item );
            }

            // 3. Trigger sort_updated() by calling top()
            heap.top();

            // 4. Verify invariants
            const isValid = verifyHeapInvariants( heap );
            if( !isValid )
            {
                // Let's print out the state for debugging if this fails
                console.error( "Failed run data:", ( heap as any ).data );
            }
            expect( isValid ).toBe( true );

            // 5. Pop all elements and check if they come out in sorted order
            let lastPriority = -Infinity;
            while( heap.size > 0 )
            {
                const poppedItem = heap.pop() as Node;
                expect( poppedItem.priority ).toBeGreaterThanOrEqual( lastPriority );
                lastPriority = poppedItem.priority;
            }
        }
    });
});
