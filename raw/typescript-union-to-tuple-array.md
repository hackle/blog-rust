For a long time I have hold the belief that it's not possible to convert a union type to a tuple (or fixed array) in TypeScript, but during the Easter weekend this was brought into review! Is it possible? Certainly! is the solution pretty? Not necessarily.

> Disclaimer: I did not invent or find the solution. See the reference section for credits. This post is an interpretation of a solution.

Here is the high-level algorithm to convert a union type to a tuple,

1. match on the union one variant at a time (just like a tuple!), this is made possible by
2. converting the union to an intersection type, which 
3. when `infer`red, gives back the first variant

Needless to say point 2) and 3) are the nail-biters. Let's first declare the algorithm.

```TypeScript
type Union2Tuple<T> =
    PickOne<T> extends infer U                  // assign PickOne<T> to U
    ? Exclude<T, U> extends never               // T and U are the same
        ? [T]
        : [...Union2Tuple<Exclude<T, U>>, U]    // recursion
    : never;
```

You'll see `Exclude` is nothing new, and `PickOne` is all we need to make this recursive type work. So here we go! 

## co-variant to contra-variant, union to intersection

First we have `Contra<T>` which moves `T` to a contra-variant position, in otherwords, make it a parameter to a function type.

For comparison we also define `Cov<T>` which puts `T` in a co-variant position; although this isn't absolutely necessary as `() => T` is just like `T` in terms of its positioning.

```TypeScript
type Contra<T> =
    T extends any 
    ? (arg: T) => void 
    : never;

type Cov<T> = 
    T extends any 
    ? () => T 
    : never;
```

An important thing to note, `extends any` always succeeds, so why? Well, it's to distribute `T` if it happens to be a union type. Which basically means `Cov<'a'|'b'>` turns into `(() => 'a') | (() => 'b')`.

There are different consequences of changing the "position" of a type from co-variant to contra-variant, one of them is how `infer` behaves. This is how. When `infer`ing from (within) a union type,

* if `infer` is in a co-variant position, a union is returned
* `contra-variants`, an intersection is returned

This is better illustrated with an example,

```TypeScript
type InferCov<T> = 
    [T] extends [() => infer I]
    ? I 
    : never
    
const t20: InferCov<Cov<'a' | 'b'>> = 'a';   // 'a' | 'b'
```

Note I use `[T]` to stop union distribution, so the union is pattern matched as a whole. Still, no surprise with co-variant.

```TypeScript
type InferContra<T> = 
    [T] extends [(arg: infer I) => void] 
    ? I 
    : never;
    
const t21: InferContra<Contra<'a'|'b'>> = 'a';  // Type 'string' is not assignable to type 'never'.ts(2322)

const t22: InferContra<Contra<{ a: 'a' } | { b: 'b' }>> = { a: 'a', b: 'b' };
```

Something significant happens - the union is turned into an intersection! That's why `t21` is `never` as `'a' & 'b' == "never"`, but `{ a: 'a' } & { b: 'b' } == { a: 'a', b: 'b' }`. (Notice how `&` behaves differently on union and product types? But that's another topic)

# Pattern matching an intersection, more variance

Preserving intersection types is a bit tricky. They collapse quite easily if there is no intersection to preserve.

```TypeScript
const t23: 'a' & 'b' = ??   // Type 'any' is not assignable to type 'never'.ts(2322)

const t24: { a: 'a' } & { b: 'b' } = { a: 'a', b: 'b' };
```

What if there is conflict / overlap from two object types?

```TypeScript
const t25: { a: 'a' } | { a: 'b' } = { a: 'a' } // or { a: 'b' }

const t26: { a: 'a' } & { a: 'b' } = { a: 'a' } // Type 'string' is not assignable to type 'never'.ts(2322)

```

See how quickly it collapses to `never`?

There is however an escape hatch to all this, that's with function types.

```TypeScript
const t27: (() => 'a') & (() => 'b') = () => "a"; // Type 'string' is not assignable to type '"a" | "b"'.ts(2322)

const t28: ((arg: 'a') => void) & ((arg: 'b') => void) = (arg: 'a' | 'b') => { return; };
```

Turns out `t27` is pretty hard to get right barring use of `any`, as it must return something that's both `a` and `b`! However, `t28` gets away by typing the arg `'a' | 'b'`, it's variance messing with us!

With that said, they are both good for pattern matching as the types are preserved. Let's try to infer the type of `arg`, using the same `InferContra<T>` defined above.

```TypeScript
const t29: InferContra<((arg: 'a') => void) & ((arg: 'b') => void)> = 'b';   // cannot be 'a'!
```

This is quite significant: `infer` when pattern matching on an intersection type gives us back the inferred type from one of the constituent types, not all, not a union, or the intersection. What a surprise!

# Prime time!
 
Now we are ready to bring them all together.

```TypeScript
const t30: InferContra<InferContra<Contra<Contra<'a'|'b'>>>> = 'b';
```

Here we have to double `Contra<T>` because `'a' & 'b' == never` but `((arg: 'a') => void) & ((arg: 'b') => void)` does not collapse. With double `Contra<T>` comes double `InferContra<T>`, routine.

So let's create a helper,

```TypeScript
type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;
const t31: PickOne<'a'|'b'> = 'b';
```

Now we are ready for prime time.

```TypeScript
type Union2Tuple<T> =
    PickOne<T> extends infer U
    ? Exclude<T, U> extends never
        ? [T]
        : [...Union2Tuple<Exclude<T, U>>, U]
    : never;

const t32: Union2Tuple<'a'|'b'|'c'|'d'|'e'> = ['a', 'b', 'c', 'd', 'e'];
```

You'll agree with me this is quite a fancy trick, and there are more than one twist to it, although it all makes sense once you've seen it. You'd also notice how variance comes into play and it probably all makes sense and were well researched and designed. All in all, I gotta say, well played, TypeScript people!

# References

- This [ridiculously great discussion](https://github.com/microsoft/TypeScript/issues/13298) on GitHub Microsoft/TypeScript
- I found the above thread indirectly via [Serhii's blog](https://personal-blog-git-master-captain-yossarian.vercel.app/union-array)

All code examples can be found [here](https://github.com/hackle/blog-rust/tree/master/sample/typescript-union-to-tuple-array.ts)