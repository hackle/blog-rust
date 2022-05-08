It must be the [street-light effect](https://en.wikipedia.org/wiki/Streetlight_effect) that I keep going back to co-variants and contra-variants across a few languages. Most recently it's for the magic of [conversion from union to tuple type](/typescript-union-to-tuple-array). Some big surprises there!

With this post I would like to explore this a bit more. These are the concepts to look at: union, object type, intersection, co-variant and contra-variant.

# Union and Intersection recap

Give two types `A` and `B`, when put in a union `A | B`, a looser type is created. If we count its values, the union type have values from `A` + values from `B`, so union types are also called sum types.  

When an intersection is created from `A & B`, a stricter / more specific type is created. It only has values that are both `A` and `B`.

Let's use this Importer / Exporter example.

```TypeScript
interface Businessman<T> { 
    trade: T,
    buys: (arg: 'money') => T;
    sells: (arg: T) => 'money';
}

interface Importer<T> extends Businessman<T> { 
   importsFrom: string
}

interface Exporter<T> extends Businessman<T> {
    exportsTo: string
}

declare const importer: Importer<'socks' | 'tie'>;
declare const exporter: Exporter<'tie' | 'hat'>;
```

A union type `Importer<'socks'> | Exporter<'socks'>` is looser, or less restrictive, as its **values** include all the **values** of`Importer<'socks'>` + all the **values** of `Exporter<'socks'>`.

It also means a value of `Importer<'socks'> | Exporter<'socks'>` is not assignable to a value of `Importer<'socks'>` (or `Exporter<'socks'>`).

```TypeScript
declare const importerOrExporter: Importer<'socks'> | Exporter<'socks'>;

// Type 'Importer<"socks"> | Exporter<"socks">' is not assignable to type 'Importer<"socks">'.
const importer1: Importer<'socks'> = importerOrExporter;
```

The intersection type `Importer<'socks'> & Exporter<'socks'>` has **values** that are **both** `Importer<'socks'>` and `Exporter<'socks'>` at the same time, so it's stricter than just `Importer<'socks'>` or `Exporter<'socks'>`; as a result, a value of the intersection type can be assigned to both types.

```TypeScript
declare const importerAndExporter: Importer<'socks'> & Exporter<'socks'>;

const importer2: Importer<'socks'> = importerAndExporter;
const exporter2: Importer<'socks'> = importerAndExporter;
```

Note I highlighted **values** as it's a common misconception that an intersection type of two object types result in "intersection" of fields from the components, as in `{ foo: string, bar: number } & { bar: number, baz: boolean } = { bar: number }`. This is an interesting topic but possibly would not have warranted a language feature! (But it's easy to implement, if you want to give it a go).

An intuition with an OOP flavour surfaces if we write `interface ImporterAndExporter<T> extends Importer<T>, Exporter<T>`, which is equivalent to `type ImporterAndExporter<T> = Importer<T> & Exporter<T>`. And the code for the example can be rewritten in intersection style, `type Importer<T> = Businessman<T> & { importsFrom: string, ... }`.

# Intersection of properties of union

It's common to act on the **common** fields of a union type. For example, the below works because `trade` field exists in both `Importer` and `Exporter`.

```TypeScript
const trades: (Importer<'socks'> | Exporter<'hats'>)['trade'] = 'hats'; // or 'socks'
```

Interesting points,
* the fields are available are the **intersection** of the fields from both `Importer` and `Exporter`. This makes sense because `['trade']` is indexing into ALL components of the union type
* the types of the field `trade` from both components are put in a union `'socks' | 'hats'` which is the type of `trades`

What about intersection type?

```TypeScript
// Type 'string' is not assignable to type 'never'.ts(2322)
const tradesI: (Importer<'socks'> & Exporter<'hats'>)['trade'] = 'hats';
```

It falls apart here: there is no way to implement `Importer<'socks'> & Exporter<'hats'>` as it results in the `trade` field being `'socks' & 'hats'` == `never`. (Despite how it makes perfect sense in real world).

# Variance and Distribution of union

More interesting things happen when functions are involved, in our case, `buys` and `sells`.

```TypeScript
buys: (arg: 'money') => T;
sells: (arg: T) => 'money';
```

Most importantly, in `buys`, `T` is in co-variant position and in `sells`, contra-variant. Does `T` follow the same behaviour through union / intersections as in the previous section, as indexing with `['trade']`?

The results look consistent so far.

```TypeScript
// sells: ((arg: "socks") => 'money') | ((arg: "hats") => 'money')
declare const sellsU: (Importer<'socks'> | Exporter<'hats'>)['sells'];

// never
declare const sellsI: (Importer<'socks'> & Exporter<'hats'>)['sells'];
```

Yawn, is that all...? Well, what if we get crazy here, and say these are business people in ... **functions**? Non-coincidentally, it's the classic trick when looking at co- and contra-variance.

Before we dive in we need two utility functions that extracts ("infers") the "trade" from the return type of `buys` and the parameter of `sells`. Also we use `[T]` to stop distribution when `T` is a union type. A common trick.

```TypeScript
type InferTradeFromBuys<T> = 
    [T] extends [{ buys: (arg: 'money') => infer I }] ? I : never;

type InferTradeFromSells<T> = 
    [T] extends [{ sells: (arg: infer I) => 'money' }] ? I : never;
```

Now let's go...

```TypeScript
// (() => 'socks') & (() => 'hats')
declare const sellsFnU: InferTradeFromSells<Importer<() => 'socks'> | Exporter<() => 'hats'>>;

// (() => 'socks') | (() => 'hats')
declare const buysFnU: InferTradeFromBuys<Importer<() => 'socks'> | Exporter<() => 'hats'>>;
```

Oh... something very interesting has happened here. Why does `InferTradeFromSells` return an intersection type while `InferTradeFromBuys` a union? 

You would have realised - we find some pretty hidden power in TypeScript that combines variance and the duality between union and intersection. 

We must not stop here, as it can get more dizzying, if we have business people dealing in function of function... ok let's ditch the businessman example and get serious.

We need a `Contra<T>` that takes `T` to a contra-variant position, namely, as a parameter. Note `T` can be any type, even a `Contra<T>` itself.

```TypeScript
type Contra<T> = (arg: T) => void;
```

Then we have `InferContra<T>` that extracts `T` from a stack of nested contra-variant functions.

```TypeScript
type InferContra<T> = 
    [T] extends [Contra<infer I>] ? I : never;

type InferContra2<T> = 
    [T] extends [Contra<Contra<infer I>>] ? I : never;

type InferContra3<T> = 
    [T] extends [Contra<Contra<Contra<infer I>>>] ? I : never;

type InferContra4<T> = 
    [T] extends [Contra<Contra<Contra<Contra<infer I>>>>] ? I : never;
```

Now let's see what happens,

```TypeScript
// { trade1: 'socks'; } & { trade2: 'hats'; }
declare const contra1: InferContra<
    Contra<{ trade1: 'socks' }> |
    Contra<{ trade2: 'hats' }>
>;

// { trade1: 'socks'; } | { trade2: 'hats'; }
declare const contra2: InferContra2<
    Contra<Contra<{ trade1: 'socks' }>> |
    Contra<Contra<{ trade2: 'hats' }>>
>;

// { trade1: 'socks'; } & { trade2: 'hats'; }
declare const contra3: InferContra3<
    Contra<Contra<Contra<{ trade1: 'socks' }>>> |
    Contra<Contra<Contra<{ trade2: 'hats' }>>>
>;

// { trade1: 'socks'; } | { trade2: 'hats'; }
declare const contra4: InferContra4<
    Contra<Contra<Contra<Contra<{ trade1: 'socks' }>>>> |
    Contra<Contra<Contra<Contra<{ trade2: 'hats' }>>>>
>;
```

I'll be damned... the result types alternate between union and intersection. TypeScript really thought this through. I am impressed.