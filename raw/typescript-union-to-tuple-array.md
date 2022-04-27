For a long time I held the belief that it's not possible to convert a union type to a tuple (or fixed array) in TypeScript, but during the Easter weekend I was glad to find otherwise. Is it possible? Certainly! is the solution pretty? Not necessarily...

> Disclaimer: I did not invent or find the solution. See the reference section for credits. This post is an interpretation.

Here is the high-level algorithm to convert a union type to a tuple,

1. match on the union one variant at a time (just like on a tuple!), this is made possible by
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
    
const so: Union2Tuple<'a'|'b'|'c'|'d'|'e'> = ['a', 'b', 'c', 'd', 'e'];
```

You'll see `Exclude` is nothing new, and `PickOne` is all we need to make this recursive type work. So here we go! 

## co-variant to contra-variant, union to intersection

First we have `Contra<T>` which moves `T` to a contra-variant position, in other words, makes it a parameter to a function type.

For comparison, we also define `Cov<T>` which puts `T` in a co-variant position; although this isn't absolutely necessary as `() => T` is just like `T` in terms of positioning.

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

You would have noted that `extends any` will always succeed, so why bother? Well, it's to [distribute](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types) `T` if it happens to be a union type. When put into practice, it means `Cov<'a'|'b'>` turns into `(() => 'a') | (() => 'b')`.

There are different consequences of changing the "position" of a type from co-variant to contra-variant, one of them is how `infer` behaves. Specifically, when `infer`ing from (within) a union type as a whole,

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

Note I use `[T]` vs a bare `T` to stop union [distribution](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types), so the union is pattern matched as a whole. Still, no surprise with co-variant.

Now let's try contra-variants.

```TypeScript
type InferContra<T> = 
    [T] extends [(arg: infer I) => void] 
    ? I 
    : never;
    
const t21: InferContra<Contra<'a'|'b'>> = 'a';  // Type 'string' is not assignable to type 'never'.ts(2322)

const t22: InferContra<Contra<{ a: 'a' } | { b: 'b' }>> = { a: 'a', b: 'b' };
```

Something significant happens - the union is turned into an intersection! That's why `t21` is `never` as `'a' & 'b' ~ never`, but `{ a: 'a' } & { b: 'b' } ~ { a: 'a', b: 'b' }`. (Notice how `&` behaves differently on union and product types? ...a whole different topic).

If you think this is a cutting-edge feature, it was introduced way back with TypeScript 2.8. See the [handbook](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#:~:text=Likewise%2C%20multiple%20candidates%20for%20the%20same%20type%20variable%20in%20contra%2Dvariant%20positions%20causes%20an%20intersection%20type%20to%20be%20inferred%3A). 

Check to point 2) converting the union to an intersection type; next we need to figure out 3) to pattern match on an intersection type and turn it into a tuple.

# Pattern matching an intersection, with more variance!

The very first challenge is, in order to pattern match on type `A`, it must preserve and expose information to be matched on. For example, a tuple `['a', 'b']`, an object type `{ a: 'a', b: 'a' }` are both very specific, and lend to good inspection; on the other hand, `[string]`, `Record<string, string>` or `any` does not contain as much information, and does not give us as much to work on. 

Preserving information for intersection types is a bit tricky - they collapse quite easily if there is no "intersection" or overlap to be preserved. Consider the below example. 

```TypeScript
const t23: 'a' & 'b' = ??   // Type 'any' is not assignable to type 'never'.ts(2322)

const t24: { a: 'a' } & { b: 'b' } = { a: 'a', b: 'b' };
```

`'a' & 'b'` evaluates to `never` quite quickly for lack of "intersection"; more importantly, we cannot get `'a' & 'b'` back with `typeof t23` - it's "collapsed". Object types fare much better with `&`, as fields from both are preserved.

What if there is conflict / overlap from two object types before intersection?

```TypeScript
// a union for reference
const t25: { a: 'a' } | { a: 'b' } = { a: 'a' } // or { a: 'b' }

const t26: { a: 'a' } & { a: 'b' } = { a: 'a' } // Type 'string' is not assignable to type 'never'.ts(2322)
```

The field `a` is preserved, but see how quickly its type is collapsed to `never`?

It would seem intersection types can't help us here, as it does not preserve types before its evaluation. However, there is an escape hatch in the form of, you guess it, function types.

```TypeScript
// as return type: co-variant
const t27: (() => 'a') & (() => 'b') = () => "a"; // Type 'string' is not assignable to type '"a" | "b"'.ts(2322)

// as parameter: contra-variant
const t28: ((arg: 'a') => void) & ((arg: 'b') => void) = (arg: 'a' | 'b') => { return; };
```

(Turns out giving a value to `t27` is pretty hard barring the use of `any`, as it must return something that's both `a` and `b`! However, `t28` gets away by typing the arg `'a' | 'b'`, it's variance messing with us again. This is interesting stuff, and I'll take a note to explore it later on.)

Regardless of the difficulty on the value level, both forms are good for pattern matching as the types are preserved - exactly what we are after! Let's try to infer the type of `arg`, using the same `InferContra<T>` defined above.

```TypeScript
const t29: InferContra<((arg: 'a') => void) & ((arg: 'b') => void)> = 'b';   // cannot be 'a'!
```

This is quite significant: `infer` is used for pattern matching on an intersection type, and it gives us the inferred type from ONE and only ONE of the constituent types. What a [surprise](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#:~:text=Likewise%2C%20multiple%20candidates%20for%20the%20same%20type%20variable%20in%20contra%2Dvariant%20positions%20causes%20an%20intersection%20type%20to%20be%20inferred%3A)!

# Prime time!
 
Now we are ready to bring them all together. By now there are a few small utility types handy, so let's take them for a test. 

```TypeScript
const t30: InferContra<InferContra<Contra<Contra<'a'|'b'>>>> = 'b'; // but not 'a'
```

Here we have to double `Contra<T>`, because `'a' & 'b' == never` collapses (if we just `Contra` once), but `((arg: 'a') => void) & ((arg: 'b') => void)` does not, as we've seen in the previous section. With double `Contra<T>` comes double `InferContra<T>`, no surprise; do note though, while `Contra` is distributive, `InferContra` is not.

The type of `t30` is actually quite handy, so let's make it a helper, a.k.a. the long-heralded `PickOne`,

```TypeScript
type PickOne<T> = InferContra<InferContra<Contra<Contra<T>>>>;
const t31: PickOne<'a'|'b'> = 'b';
```

Well, is the final solution jumping out of the screen yet? Here it is,

```TypeScript
type Union2Tuple<T> =
    PickOne<T> extends infer U
    ? Exclude<T, U> extends never
        ? [T]
        : [...Union2Tuple<Exclude<T, U>>, U]
    : never;

const t32: Union2Tuple<'a'|'b'|'c'|'d'|'e'> = ['a', 'b', 'c', 'd', 'e'];
```

You'll agree with me this is quite a fancy trick, and there are more than one twist to it, which I hope are making sense by now. I also love how variance comes into play (every so often!), alongside a few less well-known language features. All in all, I gotta say, well played, TypeScript!

# References

- This [ridiculously great discussion](https://github.com/microsoft/TypeScript/issues/13298) on GitHub Microsoft/TypeScript
- I found the above thread indirectly via [Serhii's blog](https://personal-blog-git-master-captain-yossarian.vercel.app/union-array)

All code examples can be found [here](https://github.com/hackle/blog-rust/tree/master/sample/typescript-union-to-tuple-array.ts)