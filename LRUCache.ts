// https://leetcode-cn.com/problems/lru-cache/

// train of thought:
// - hash : key->pos, for O(1) get;
// - loop_queue: pos->[key,value], for record LRU info, its order implies latest recently used info
//   when cache is full filled, dequeue first, and there is empty pos for putting [key,value]
//   you enqueue the [key, value] tail of queue,
//   - use loop queue, you can do enqueue/dequeue in O(1) time
// -  each time you do put/get, update order in queue as fresh LRU info. 
//    Turning a item in queue back bound by tail, takes only O(1) time.
// So the put/get operations of LRUCache take at most O(1) time.


export class LRUCache {
    constructor(public max_length: number) {
        assert_positive_integer(max_length);
        // this.pos_kv_cache = Array.from({length});
    }

    public get(key: number) {
        // if( this.key_pos_cache)
        if (this.hash_cache.hasOwnProperty(key)) {
            const pos = this.hash_cache[key];
            const value = this.kv_cache[pos];

            this.update_LRU_info(key);

            return value
        }
    }
    public put(key: number, value: number) {
        if (!this.hash_cache.hasOwnProperty(key)) {
            if (this.kv_cache.is_full_filled()) {
                const head_kv = this.kv_cache.dequeue();
                assert_not_void(head_kv);
                const [head_key] = head_kv as [number ,number];
                delete this.hash_cache[head_key];

                this.kv_cache.enqueue([key,value])
                this.hash_cache[key] = this.kv_cache.tail;
            }
            else {
                this.kv_cache.enqueue([key, value])
                this.hash_cache[key] = this.kv_cache.tail;
            }
        }
        else {
            const target_pos = this.hash_cache[key];
            this.assert_pos_in_kv_cache(target_pos);

            const kv = this.kv_cache.get(target_pos);
            kv[1] = value;
            this.update_LRU_info(key);
        }
    }
    private update_LRU_info(key: number) {
        const target_pos = this.hash_cache[key];
        const back_pos = mod_add(target_pos, 1, this.kv_cache.max_length);
        if (back_pos !== this.kv_cache.tail) {
            const back_kv = this.kv_cache.get(back_pos);
            const [back_key] = back_kv;
            // swap pos cached in hash_cache
            this.hash_cache[key] = back_pos;
            this.hash_cache[back_key] = target_pos;

            // turn target_kv entry back
            this.kv_cache.swap_in_queue(target_pos, back_pos);
        }
    }

    private assert_pos_in_kv_cache(pos: number) {
        if (!this.kv_cache.is_in_queue(pos)) { throw new Error(`err ${pos}`) }
    }
    // private static last_index(arr: any[]): number { return arr.length - 1; }


    private hash_cache: Object = {};
    private kv_cache: LoopQueue<[number/**key */, number/**value */]> = new LoopQueue(this.max_length);

}
// FIX Buggy boundary condition of head/tail when enqueue/dequeue
class LoopQueue<T>{
    constructor(public readonly max_length: number) {
        this._head = 0;
        this._tail = 0;
        this.cache = Array.from({ length: max_length });
    }
    private cache: Array<T>;
    public get head(): number { return this._head; }
    public get tail(): number { return this._tail; }
    private _head: number;
    private _tail: number;
    public enqueue(v: T) {
        this.assert_not_full_filled();
        this.cache[this._tail] = v;
        this.used_length += 1;
        this.increment_tail();
    }

    public dequeue(): T | void {
        this.assert_not_empty()
        const v = this.cache[this._head];
        this.increment_head();
        this.used_length -= 1;
        return v;
    }
    public get(pos: number): T {
        this.assert_pos_in_queue(pos);
        return this.cache[pos];
    }
    private assert_not_full_filled(): void | never {
        if (this.is_full_filled()) { throw new Error("full filled queue") };
    }
    private assert_not_empty(): void | never {
        if (this.is_full_filled()) { throw new Error("empty queue") };
    }
    public is_full_filled(): boolean {
        return this.used_length === this.max_length;
    }
    public is_empty(): boolean {
        return this.used_length === 0;
    }

    private used_length: number = 0
    public swap_in_queue(i: number, j: number) {
        this.assert_pos_in_queue(i);
        this.assert_pos_in_queue(j);
        // swap
        const temp = this.cache[i];
        this.cache[i] = this.cache[j];
        this.cache[j] = temp;
    }
    private assert_pos_in_queue(pos: number): void | never {
        if (!this.is_in_queue(pos)) { throw new Error(`${pos} is not in queue`); }
    }
    public is_in_queue(pos: number) {
        return !(pos > this._tail && pos < this._head);
    }
    private increment_head() {
        this._head = mod_add(this._head, 1, this.max_length);
    }

    private increment_tail() {
        this._tail = mod_add(this._tail, 1, this.max_length);
    }

}

export function assert(bool: boolean, msg: string = "assert error") {
    if (!bool) { throw new Error(msg); }
}
function assert_positive_integer(...nums: number[]): void | never {
    if (nums.length == 0) { return; }
    const [num, ...rest] = nums;
    if (num <= 0 || !Number.isInteger(num)) { throw new Error("need positive integer") }
    assert_positive_integer(...rest);
}

function mod_add(a: number, b: number, mod: number) {
    assert_positive_integer(a, b, mod);
    return (a + b) % mod;
}
function assert_not_void(v: any):void|never {
    if(v=== undefined || v===null) { throw new Error("void") }
}

export function * filledRange<Data>(toFill?:Data,size:number = 1){
    // assert size is natural
    let i = size;
    while(i--){
        yield toFill;
    }
}
