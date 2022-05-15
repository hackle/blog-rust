export {};

type T1 = 'a' | 'b';
type T2 = 'b' | 'c';

// type T3 = "b"
type T3 = T1 & T2;

type T4 = { 'f1': string, 'f2': number };
type T5 = { 'f2': number, 'f3': string };

type T6 = T4 & T5;

const v1: T6 = {
    'f1': 'ha',
    'f2': 1,
    'f3': 'ha',
};

interface I4 { 'f1': string, 'f2': number };
interface I5 { 'f2': number, 'f3': string };
interface I6 extends I4, I5 {}


type T7 = { 'f1': string };
type T8 = { 'f2': number };

type T9 = T7 | T8;
const v9_1: T9 = { 'f1': 'a' };
const v9_2: T9 = { 'f2': 1 };

type T10 = T7 & T8;
const v10: T10 = { 'f1': 'a', 'f2': 1 };

type Parse<T extends string> = 
    T extends `${infer T1} or ${infer T2}`
    ? Parse<T1> | Parse<T2>
    : T extends `${infer T1} and ${infer T2}`
        ? Parse<T1> & Parse<T2>
        : { [k in T]: true };

const p1: Parse<'a and b and c'> = { 'a': true, 'b': true, 'c': true };
const p2_a: Parse<'a or b'> = { 'a': true };
const p2_b: Parse<'a or b'> = { 'b': true };


// type T4 = { 'f1': string, 'f2': number };
// type T5 = { 'f2': number, 'f3': string };

type T11 = T4 | T5;

// const v11: "f2"
declare const v11: keyof T11;

// const v12: "f2"
declare const v12: keyof T4 & keyof T5;

type Covariant<T> = () => T;

let co1: Covariant<'a' | 'b'>;

declare const co2: Covariant<'a'>;
co1 = co2; // this is ok

declare const co3: Covariant<'a' | 'b' | 'c'>;
/*
Type 'Covariant<"a" | "b" | "c">' is not assignable to type 'Covariant<"a" | "b">'.
  Type '"a" | "b" | "c"' is not assignable to type '"a" | "b"'.
    Type '"c"' is not assignable to type '"a" | "b"'.ts(2322)
*/
co1 = co3;


type ContraVariant<T> = (arg: T) => void;

let contr1: ContraVariant<'a' | 'b'>;

declare const contr2: ContraVariant<'a' | 'b' | 'c'>;
contr1 = contr2;    // this is ok!

declare const contr3: ContraVariant<'a'>;
/*
Type 'ContraVariant<"a">' is not assignable to type 'ContraVariant<"a" | "b">'.
  Type '"a" | "b"' is not assignable to type '"a"'.
    Type '"b"' is not assignable to type '"a"'.ts(2322)
*/
contr1 = contr3;

type Co<T> = () => T;
type Contra<T> = (arg: T) => void;

type InferCo<Fn> = 
    [Fn] extends [Co<infer T>] ? T : never;

type InferContra<Fn> = 
    [Fn] extends [Contra<infer T>] ? T : never;

/*
const infer_co1: {
    f1: 'f1';
} | {
    f2: 'f2';
} 
*/
declare const infer_co1: InferCo<
    Co<{ f1: 'f1' }> |
    Co<{ f2: 'f2' }>
>;

/*
const contra1: {
    f1: 'f1';
} & {
    f2: 'f2';
}
*/
declare const infer_contra1: InferContra<
    Contra<{ f1: 'f1' }> |
    Contra<{ f2: 'f2' }>
>;

// remember ^ is equivalent to
declare const infer_contra2: [
    ((arg: { f1: 'f1' }) => void) |
    ((arg: { f2: 'f2' }) => void)
] extends [ ((arg: infer I) => void) ] 
    ? I 
    : never;

type InferUnionContra<Fn> =
    [Fn] extends [((arg: infer T) => void) | ((arg: infer T) => void)]
    ? T
    : never;

/*
const infer_union_contra: {
    f1: 'f1';
} & {
    f2: 'f2';
}
*/
declare const infer_union_contra: InferUnionContra<
    Contra<{ f1: 'f1' }> |
    Contra<{ f2: 'f2' }>
>;

type InferName<T> = T extends `hello ${infer Name}` ? Name : never;

// 'hello world' <--> T, 'world' <--> Name
const name: InferName<'hello world'> = 'world';

// substitute T and infer Name with actual values
type CheckInferName = 'hello world' extends `hello world` ? true : false;

// should be the same as InferName<'hello world'>
const check_name: CheckInferName = true;

/* remember: 
    type Contra<T> = (arg: T) => void;
    type InferContra<Fn> = [Fn] extends [Contra<infer T>] ? T : never;
*/

// the expanded form of: Contra<{ f1: 'f1' }> | Contra<{ f2: 'f2' }>
type UnionInput = ((arg: { f1: 'f1' }) => void) | ((arg: { f2: 'f2' }) => void);

type IntersectionSatisfiesEquation = 
    [UnionInput] extends [((arg: { f1: 'f1' } & { f2: 'f2' }) => void)] ? true : false;

const check_intersection: IntersectionSatisfiesEquation = true;

type UnionSatisfiesEquation = 
    [UnionInput] extends [((arg: { f1: 'f1' } | { f2: 'f2' }) => void)] ? true : false;

const check_union: UnionSatisfiesEquation = false;

type InferUnionContra2<Fn> =
    [Fn] extends [ ((arg: ((arg: infer T) => void)) => void) | ((arg: ((arg: infer T) => void)) => void)]
    ? T
    : never;

declare const infer_union_contra2: InferUnionContra2<
    Contra<Contra<{ f1: 'f1' }>> |
    Contra<Contra<{ f2: 'f2' }>>
>;

type InferContra2<T> = 
    [T] extends [Contra<Contra<infer I>>] ? I : never;

type InferContra3<T> = 
    [T] extends [Contra<Contra<Contra<infer I>>>] ? I : never;

type InferContra4<T> = 
    [T] extends [Contra<Contra<Contra<Contra<infer I>>>>] ? I : never;


/*
const contra2: {
    f1: 'f1';
} | {
    f2: 'f2';
}
*/
declare const contra2: InferContra2<
    Contra<Contra<{ f1: 'f1' }>> |
    Contra<Contra<{ f2: 'f2' }>>
>;

/*
const contra3: {
    f1: 'f1';
} & {
    f2: 'f2';
}
*/
declare const contra3: InferContra3<
    Contra<Contra<Contra<{ f1: 'f1' }>>> |
    Contra<Contra<Contra<{ f2: 'f2' }>>>
>;

/*
const contra4: {
    f1: 'f1';
} | {
    f2: 'f2';
}
*/
declare const contra4: InferContra4<
    Contra<Contra<Contra<Contra<{ f1: 'f1' }>>>> |
    Contra<Contra<Contra<Contra<{ f2: 'f2' }>>>>
>;