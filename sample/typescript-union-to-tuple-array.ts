type Contra<T> =
    T extends any
    ? (arg: T) => void
    : never;

type Cov<T> =
    T extends any
    ? () => T
    : never;

type InferCov<T> =
    [T] extends [() => infer I]
    ? I
    : never

const t20: InferCov<Cov<'a' | 'b'>> = 'a';

type InferContra<T> =
    [T] extends [(arg: infer I) => void]
    ? I
    : never;

const t21: InferContra<Contra<'a'|'b'>> = 'a';  // Type 'string' is not assignable to type 'never'.ts(2322)


const t22: InferContra<Contra<{ a: 'a' } | { b: 'b' }>> = { a: 'a', b: 'b' };

const t23: 'a' & 'b' = ??   // Type 'any' is not assignable to type 'never'.ts(2322)

const t24: { a: 'a' } & { b: 'b' } = { a: 'a', b: 'b' };

const t25: { a: 'a' } | { a: 'b' } = { a: 'a' } // or { a: 'b' }
const t26: { a: 'a' } & { a: 'b' } = { a: 'a' } // Type 'string' is not assignable to type 'never'.ts(2322)

const t27: (() => 'a') & (() => 'b') = () => "a"; // Type 'string' is not assignable to type '"a" | "b"'.ts(2322)

const t28: ((arg: 'a') => void) & ((arg: 'b') => void) = (arg: 'a' | 'b') => { return; };

const t29: InferContra<((arg: 'a') => void) & ((arg: 'b') => void)> = 'b';  // cannot be 'a'!



const t30: InferContra<InferContra<Contra<Contra<'a'|'b'>>>> = 'b';

type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;
const t31: PickOne<'a'|'b'> = 'b';


type Union2Tuple<T> =
    PickOne<T> extends infer U
    ? Exclude<T, U> extends never
        ? [T]
        : [...Union2Tuple<Exclude<T, U>>, U]
    : never;

const t32: Union2Tuple<'a'|'b'|'c'|'d'|'e'> = ['a', 'b', 'c', 'd', 'e'];