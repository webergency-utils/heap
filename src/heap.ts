export type Comparator<T> = ( a: T, b: T ) => number;
export type IdGetter<T, I = T> = ( item: T ) => I;

const DEFAULT_COMPARATOR = <T>( a: T, b: T ): number => a < b ? -1 : ( a > b ? 1 : 0 );
const DEFAULT_ID_GETTER = <T, I>( item: T ): I => item as unknown as I;

export default class Heap<T, I = T>
{
    protected data    : T[];
    protected index   : Map<I, number> | undefined;
    protected compare : Comparator<T>;
    protected get_id  : IdGetter<T, I>;
    protected sorted  : boolean = true;
    protected updated = new Set<T>();

    constructor( comparator?: Comparator<T>, id_getter?: IdGetter<T, I> )
    {
        this.data = [];
        this.compare = comparator ?? DEFAULT_COMPARATOR;
        this.get_id = id_getter ?? DEFAULT_ID_GETTER;
    }

    static from<T, I = T>( container: Iterable<T> | Map<any, T>, comparator?: Comparator<T>, id_getter?: IdGetter<T, I> ): Heap<T, I>
    {
        const heap = new Heap<T, I>( comparator, id_getter );

        heap.data = Array.from( container instanceof Map ? container.values() : container );

        for( let i = ( heap.data.length - 2 ) >> 1; i >= 0; --i )
        {
            heap.sift_down( i );
        }

        return heap;
    }

    protected sift_up( i: number ): void
    {
        const data = this.data;
        const compare = this.compare;
        const item = data[i];

        if( this.index )
        {
            const index = this.index;
            const get_id = this.get_id;

            while( i > 0 )
            {
                const pi = ( i - 1 ) >> 1;
                const parent = data[pi];

                if( compare( item, parent ) >= 0 ){ break }

                data[i] = parent;
                index.set( get_id( parent ), i );
                i = pi;
            }

            data[i] = item;
            index.set( get_id( item ), i );
        }
        else
        {
            while( i > 0 )
            {
                const pi = ( i - 1 ) >> 1;
                const parent = data[pi];

                if( compare( item, parent ) >= 0 ){ break }

                data[i] = parent;
                i = pi;
            }

            data[i] = item;
        }
    }

    protected sift_down( i: number ): void
    {
        const data = this.data;
        const len = data.length;
        let ci = ( i << 1 ) + 1;

        if( ci >= len ){ return }

        const compare = this.compare;
        const item = data[i];

        if( ci + 1 < len && compare( data[ci + 1], data[ci]) < 0 )
        {
            ci = ci + 1;
        }

        let child = data[ci];

        if( compare( child, item ) >= 0 ){ return }

        if( this.index )
        {
            const index = this.index;
            const get_id = this.get_id;

            do
            {
                data[i] = child;
                index.set( get_id( child ), i );
                i = ci;
                ci = ( i << 1 ) + 1;

                if( ci >= len ){ break }

                if( ci + 1 < len && compare( data[ci + 1], data[ci]) < 0 )
                {
                    ci = ci + 1;
                }

                child = data[ci];
            }
            while( compare( child, item ) < 0 );

            data[i] = item;
            index.set( get_id( item ), i );
        }
        else
        {
            do
            {
                data[i] = child;
                i = ci;
                ci = ( i << 1 ) + 1;

                if( ci >= len ){ break }

                if( ci + 1 < len && compare( data[ci + 1], data[ci]) < 0 )
                {
                    ci = ci + 1;
                }

                child = data[ci];
            }
            while( compare( child, item ) < 0 );

            data[i] = item;
        }
    }

    protected sift( i: number ): void
    {
        if( this.data.length < 2 ){ return }

        if( i !== 0 && this.compare( this.data[i], this.data[( i - 1 ) >> 1]) < 0 )
        {
            this.sift_up( i );
        }
        else
        {
            this.sift_down( i );
        }
    }

    protected reindex(): void
    {
        const data = this.data;
        const get_id = this.get_id;
        const index = new Map<I, number>();

        for( let i = 0; i < data.length; ++i )
        {
            index.set( get_id( data[i]), i );
        }

        this.index = index;
    }

    protected get_item_index( item: T ): number | undefined
    {
        if( this.data.length )
        {
            if( this.data[0] === item )
            {
                return 0;
            }
            else
            {
                if( !this.index ){ this.reindex() }

                return this.index!.get( this.get_id( item ));
            }
        }

        return undefined;
    }

    public get size(): number
    {
        return this.data.length;
    }

    public get isEmpty(): boolean
    {
        return this.data.length === 0;
    }

    public top(): T | undefined
    {
        if( this.data.length )
        {
            if( !this.sorted ){ this.sort_updated() }

            return this.data[0];
        }

        return undefined;
    }

    public peek(): T | undefined
    {
        return this.top();
    }

    public push( item: T ): this
    {
        const i = this.data.length;
        this.data.push( item );

        if( this.sorted )
        {
            this.sift_up( i );
        }
        else
        {
            if( this.index )
            {
                this.index.set( this.get_id( item ), i );
            }

            this.updated.add( item );

            if( this.updated.size > Math.max( 10, this.data.length * 0.1 ))
            {
                this.sort_updated();
            }
        }

        return this;
    }

    public pop(): T | undefined
    {
        if( this.data.length )
        {
            if( !this.sorted ){ this.sort_updated() }

            const last = this.data.pop()!;

            if( this.data.length )
            {
                const top = this.data[0];
                this.data[0] = last;

                if( this.index )
                {
                    if( this.index.size < this.data.length + 1 )
                    {
                        this.index = undefined;
                    }
                    else
                    {
                        this.index.delete( this.get_id( top ));
                        this.index.set( this.get_id( last ), 0 );
                    }
                }

                this.sift_down( 0 );

                return top;
            }
            else
            {
                if( this.index )
                {
                    this.index.delete( this.get_id( last ));
                }

                return last;
            }
        }

        return undefined;
    }

    public get( id: I ): T | undefined
    {
        if( this.data.length )
        {
            if( !this.index ){ this.reindex() }

            const index = this.index!.get( id );

            if( index !== undefined )
            {
                return this.data[index];
            }
        }

        return undefined;
    }

    public has( id: I ): boolean
    {
        if( this.data.length )
        {
            if( !this.index ){ this.reindex() }

            return this.index!.has( id );
        }

        return false;
    }

    public values(): IterableIterator<T>
    {
        return this.data.values();
    }

    public [Symbol.iterator](): IterableIterator<T>
    {
        return this.values();
    }

    public update( item: T ): boolean
    {
        const i = this.get_item_index( item );

        if( i !== undefined )
        {
            if( this.data[i] !== item )
            {
                this.updated.delete( this.data[i]);
                this.data[i] = item;
            }

            this.sorted = false;
            this.updated.add( item );

            if( this.updated.size > Math.max( 10, this.data.length * 0.1 ))
            {
                this.sort_updated();
            }

            return true;
        }

        return false;
    }

    public delete( item: T ): boolean
    {
        if( this.data.length )
        {
            const i = this.get_item_index( item );

            if( i !== undefined )
            {
                const target = this.data[i];

                if( !this.sorted )
                {
                    this.updated.delete( target );
                    this.updated.delete( item );

                    if( this.updated.size === 0 )
                    {
                        this.sorted = true;
                    }
                }

                if( i === 0 && this.sorted )
                {
                    this.pop();
                }
                else
                {
                    const last = this.data.pop()!;

                    if( this.index )
                    {
                        if( this.index.size < this.data.length + 1 )
                        {
                            this.index = undefined;
                        }
                        else
                        {
                            this.index.delete( this.get_id( target ));
                        }
                    }

                    if( i < this.data.length )
                    {
                        this.data[i] = last;

                        if( this.index )
                        {
                            this.index.set( this.get_id( last ), i );
                        }

                        if( this.sorted )
                        {
                            this.sift( i );
                        }
                        else
                        {
                            this.updated.add( last );

                            if( this.updated.size > Math.max( 10, this.data.length * 0.1 ))
                            {
                                this.sort_updated();
                            }
                        }
                    }
                }

                return true;
            }
        }

        return false;
    }

    public clear(): this
    {
        this.data = [];
        this.index = undefined;
        this.sorted = true;
        this.updated.clear();

        return this;
    }

    public clone(): Heap<T, I>
    {
        const heap = new Heap<T, I>( this.compare, this.get_id );
        heap.data = [ ...this.data ];

        if( this.index )
        {
            heap.index = new Map( this.index );
        }

        heap.sorted = this.sorted;
        heap.updated = new Set( this.updated );

        return heap;
    }

    protected sort_updated(): void
    {
        if( this.updated.size === 1 )
        {
            const item = this.updated.values().next().value!;
            const idx = this.get_item_index( item )!;

            this.sift( idx );
        }
        else if( this.index && this.index.size === this.data.length && this.updated.size <= ( this.data.length >> 5 ))
        {
            const index = this.index;
            const get_id = this.get_id;
            const idxs: number[] = [];

            for( const item of this.updated )
            {
                idxs.push( index.get( get_id( item ))! );
            }

            idxs.sort(( a, b ) => b - a );

            for( let i = 0; i < idxs.length; ++i )
            {
                this.sift_down( idxs[i]);
            }

            idxs.length = 0;

            for( const item of this.updated )
            {
                idxs.push( index.get( get_id( item ))! );
            }

            idxs.sort(( a, b ) => a - b );

            for( let i = 0; i < idxs.length; ++i )
            {
                this.sift_up( idxs[i]);
            }
        }
        else
        {
            if( this.index && this.index.size < this.data.length )
            {
                this.index = undefined;
            }

            for( let i = ( this.data.length - 2 ) >> 1; i >= 0; --i )
            {
                this.sift_down( i );
            }
        }

        this.sorted = true;
        this.updated.clear();
    }

    public sort(): this
    {
        if( this.index && this.index.size < this.data.length )
        {
            this.index = undefined;
        }

        for( let i = ( this.data.length - 2 ) >> 1; i >= 0; --i )
        {
            this.sift_down( i );
        }

        this.sorted = true;
        this.updated.clear();

        return this;
    }
}
