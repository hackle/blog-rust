Why is `{ 'f1': string, 'f2': number } & { 'f2': number, 'f3': string }` not `{ 'f2': number }`?

And ready for some fireworks with the wild mix of union, intersection and variance?

(It must be the [street-light effect](https://en.wikipedia.org/wiki/Streetlight_effect) that I keep going back to co-variants and contra-variants across a few languages. Most recently it's for the magic of [conversion from union to tuple type](/typescript-union-to-tuple-array).)

# Union and Intersection: count values, not fields

Give two types `A` and `B`, when put in a union `A | B`, a looser type is created. If we count its values, the union type have values from `A` + values from `B`, so union types are also called sum types. This feature itself is straightforward - albeit sorely missing from many main stream languages.

When an intersection is created from `A & B`, a stricter / more specific type is created. It only has values that are both `A` and `B`. This can be confusing to many, especially when it comes to object types. 

Quite reminiscent of algebra, we can start by looking at the intersection of unions.

```TypeScript
type T1 = 'a' | 'b';
type T2 = 'b' | 'c';

// type T3 = "b"
type T3 = T1 & T2;
```

Very intuitive and true to the name "intersection". But how about this?

```TypeScript
type T4 = { 'f1': string, 'f2': number };
type T5 = { 'f2': number, 'f3': string };

type T6 = T4 & T5;
```

Surely `T6` should be `{ 'f2': number }`?! This was exactly what I first thought. However `T6` is actually `{ 'f1': string, 'f2': number, 'f3': string }`. Why is that?

The reason is the `&` operator does not really inspect the fields of the object types, instead, the intersection applies to the values of `T4` and `T5`. What does that mean?

Think of `T4` and `T5` not as objects, because they are not - they are types! If it makes any sense, turn them into interfaces. 

```TypeScript
interface I4 { 'f1': string, 'f2': number };
interface I5 { 'f2': number, 'f3': string };

interface I6 extends I4, I5 {}
```

A trained Object-oriented mind (that's you, yes) should grok this right away. Any value of interface `I6` must have all 3 fields to satisfy both `I4` and `I5` - it's a stricter type than each.

The name "intersection" makes sense if we count the values of each type: values of `I6` is the intersection of values of `I4` and `I5`. 

# Union and intersection of one

The philosophical and curious will find there is an interesting case to the union and intersection duality. When standing alone, a type is both a single-case union and a single-case intersection on its own. This may sound like a smart-ass revelation, but it can offer some interesting perspectives.

```TypeScript
type T7 = { 'f1': string };
type T8 = { 'f2': number };

type T9 = T7 | T8;
const v9_1: T9 = { 'f1': 'a' };
const v9_2: T9 = { 'f2': 1 };

type T10 = T7 & T8;
const v10: T10 = { 'f1': 'a', 'f2': 1 };
```

By using `|` or `&` as combinator, we can build up more complex types. For example, this naive yet fun `Parse` type.

```TypeScript
type Parse<T extends string> = 
    T extends `${infer T1} or ${infer T2}`
    ? Parse<T1> | Parse<T2>
    : T extends `${infer T1} and ${infer T2}`
        ? Parse<T1> & Parse<T2>
        : { [k in T]: true };

const p1: Parse<'a and b and c'> = { 'a': true, 'b': true, 'c': true };
const p2_a: Parse<'a or b'> = { 'a': true };
const p2_b: Parse<'a or b'> = { 'b': true };
```

# Intersection of keys of union

Intersection and union can appear quite closely in unexpected places. An easy example is when we try to access the properties of a union type - the available keys are the intersection of the keys of all the cases of the union type. 

```TypeScript
// type T4 = { 'f1': string, 'f2': number };
// type T5 = { 'f2': number, 'f3': string };

type T11 = T4 | T5;

// const v11: "f2"
declare const v11: keyof T11;

// const v12: "f2", same!
declare const v12: keyof T4 & keyof T5;
```

This makes sense: only the common keys can be safe for operations such as `T11['f2']`; but not `T11['f1']` as it's unsafe for `T5`.

# Variance recap

We already know that TypeScript respects variance (previously [discussed in C#](contravariant)). Never missing the opportunity to look at it again.

With covariance, typically when `T` is the return type of a function.

```TypeScript
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
```

However, when `T` is a parameter type, then the assignability is reversed - quite the mind-bender!

```TypeScript
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
```

We can also [give them signs](contravariant): co-variance is positive and contra-variance negative. Take some time, let that sink in.

# Variance, union and intersection, the fantastic mix

Intersection or union alone is not fun enough; things become **really** interesting when variance is involved.

Before we jump in, we need a couple of utility types from [a previous post](typescript-union-to-tuple-array), `Contra<T>` that takes `T` to a contra-variant position, namely, as a parameter. Note `T` can be any type, even a `Contra<T>` itself. And `Co<T>` for the opposite. 

```TypeScript
type Co<T> = () => T;
type Contra<T> = (arg: T) => void;
```

Then we have `InferContra` and `InferCo` that recovers `T`, with an important note: if `Fn` is a union type, it will be matched only once, as `[Fn]` stops [union distribution](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types). So it's not the complete reverse engineering of `Co` or `Contra`. That is possible without the `[Fn]` trick.

```TypeScript
type InferCo<Fn> = 
    [Fn] extends [Co<infer T>] ? T : never;

type InferContra<Fn> = 
    [Fn] extends [Contra<infer T>] ? T : never;
```

Now let's see what happens.

```TypeScript
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
declare const contra1: InferContra<
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
```

Do you see what's happening? `InferCo` is plain predictable, but `InferContra` from a union of two contra-variant types returns an intersection type! (Ok that's quite a mouthful.) Contra-variance strikes again in stunning fashion. 

## Inferred twice?

Can we make sense of it? Well... kind of. We can "desugar" `InferContra` further for this specific case,

```TypeScript
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
```

Notice how `infer T` can be used **twice** in the same `extends` clause? That forces TypeScript to return a single type that accounts for both of its appearances - depending on its positioning (therefore variance).

But how do we know for sure that `InferContra` is giving us the correct result?

## Equational reasoning on types

Worry not - let's call on a pretty reputable judge of character, **Equational Reasoning** (multiple rounds of thunder and lightning)! This is done by expanding the conditional type by putting in the actual input and output. This is an example.

```TypeScript
type InferName<T> = T extends `hello ${infer Name}` ? Name : never;

// 'hello world' <--> T, 'world' <--> Name
const name: InferName<'hello world'> = 'world';

// substitute T and infer Name with actual values
type CheckInferName = 'hello world' extends `hello world` ? true : false;

// this must be true
const check_name: CheckInferName = true;
```

Hold on, 'hello world' extends `hello world`? Tell me something I don't know! 

Dumb as it may seem in this trivial case, equational reasoning can come in really handy, and is definitely nothing to sneeze at. It saved my sanity many, many times.

Now we are ready to validate `InferContra`, which is considerably more complex. So... are we going to catch ourselves a cheeky cheat?

```TypeScript
/* 
    remember: 
    type Contra<T> = (arg: T) => void;
    type InferContra<Fn> = [Fn] extends [Contra<infer T>] ? T : never;
*/

// the expanded form of: Contra<{ f1: 'f1' }> | Contra<{ f2: 'f2' }>
type UnionInput = ((arg: { f1: 'f1' }) => void) | ((arg: { f2: 'f2' }) => void);

// plug them in!
type IntersectionSatisfiesEquation = 
    [UnionInput] extends [((arg: { f1: 'f1' } & { f2: 'f2' }) => void)] ? true : false;

const check_intersection: IntersectionSatisfiesEquation = true;

type UnionSatisfiesEquation = 
    [UnionInput] extends [((arg: { f1: 'f1' } | { f2: 'f2' }) => void)] ? true : false;

const check_union: UnionSatisfiesEquation = false;
```

See, `InferContra` **has to** return an intersection type, or it contradicts itself!

What's quite interesting is we normally create a value to validate a type, but here we apply equational reasoning on type level for that purpose(then create a value to validate the result). It makes perfect sense, because a type-level function is also a function, moreover, it's always pure. I am happy to admit this is the first time for me to do so.

## Contra of contra of contra-variant

We are not done yet. Knowing how contra-variance can be thought of as the minus sign, and double minus equals plus (genius!), we can test out the thoroughness of this behaviour (or feature). It's showtime.

```TypeScript
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
```

I'll be damned... It is CHECK, CHECK and CHECK. The result types alternate between union and intersection. TypeScript really thought this through. I am impressed.

Link to the [source code](https://github.com/hackle/blog-rust/blob/master/sample/variance-and-union-intersection.ts) used above.