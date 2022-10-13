Have you heard? TypeScript's union types are untagged.

Untagged unions are not a TypeScript speciality, Python also has untagged unions. But the TypeScript unions are super neat: it lets us freely combine types into new types without the verbosity of writing up new types and constructors; it even allows us to calculate union types from other union types by inspecting types in unions (with `extends` as usual). Completely unheard of!

## A Union is Useless without "Discrimination"

We put two types together to form a union type `type AOrB = A | B`. However, this is not just a one-way street. In practice, for `AOrB` to be useful, we must be able to tell `A` and `B` apart. 

```TypeScript
type AOrB = A | B;

function foo(aorb: AOrB) {
    // if aorb A or B?
}
```

Whatever method we use for "telling apart" is sometimes called the "discriminator". (You'll also come across the term "discriminated union").

## Tagging

To help discrimination, some languages generate "tags" for types in a union. This is usually the case for languages that are statically typed from the get-go. For example, `Maybe` in Haskell is [defined as](https://hackage.haskell.org/package/base-4.17.0.0/docs/src/GHC.Maybe.html#Maybe),

```Haskell
data  Maybe a  =  Nothing | Just a
```

The idea is, when `Maybe` is compiled to its runtime representation, tags are generated for both constructors: `Nothing` and `Just`. So when a `Maybe` value comes along, it's easy to discriminate,

```Haskell
valueOrDefault :: a -> Maybe a -> a
valueOrDefault def Nothing = def
valueOrDefault _ (Just a)  = a
```

Tagging takes "discrimination" away from the programmer, and makes the syntax intuitive. It also makes exhaustive pattern matching straightforward - this helps us write more code correct.

It would seem this is the happy ending - how could there be any need for untagged union? Enter TypeScript (JavaScript) and Python who are tasked with typing out historically dynamically languages and code. TypeScript especially has been very clear about this in [its design goals](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals#:~:text=Impose%20no%20runtime%20overhead%20on%20emitted%20programs.), stating "Impose no runtime overhead on emitted programs". (Which was rarely broken - with the exception of Enum?)

This goal would be violated if TypeScript generated tags for union types: runtime values would carry extra information for the sake of type checking; besides, TypeScript code would look quite different from plain JavaScript code. 

As such, TypeScript chose to use "untagged unions", same goes for Python, which also took the similar approach of "gradual typing".

## Handbook vs Wikipedia

The TypeScript handbook has a great section called [TypeScript for Functional Programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#unions), which says something quite interesting.

> In TypeScript, union types are untagged. In other words, they are not discriminated unions like data in Haskell. However, you can often discriminate types in a union using built-in tags or other properties.

But Wikipedia seems to state the opposite in its [entry for Union Type](https://en.wikipedia.org/wiki/Union_type#TypeScript) says,

> Union types are supported in TypeScript.[10] The values are implicitly "tagged" with a type by the language, and may be retrieved by "typeof()".

This is confusing! Who is the right and who is wrong?  

In my opinion they are both saying the same thing, if you are happy to "implicitly tagged" as "untagged". A more accurate description would be "TypeScript does not generate tags for union types", but types in a union can still be discriminated using type information, literal values.

## Untagged is hard

An immediate problem with untagged unions is we need to be able to tell apart the types in a union. For example, this is an anti-pattern.

```TypeScript
type EntityA = { type?: string, payload?: Record<string, any> };
type EntityB = { type?: string, payload?: string[] };

type EntityAOrB = EntityA | EntityB;
```

Do you see the problem here? It is not always possible to tell `EntityA` from `EntityB`, for example, `{}` can be either, thanks to lack of tagging and structural typing.

This trips up programmers from other languages, especially those with nominal types reflection such as C#, with which one can write `EntityA.GetType() == typeof(EntityA)` to test the type deterministically.

Thus we arrive at an easy conclusion: if for every type in a union, all fields are optional, then the union type cannot be discriminated.

In practice this can be a stumbling block for beginners to TypeScript or untagged unions. The idiomatic way to fix this problem is to add tags to types.

```TypeScript
type EntityA = { type: 'A', payload?: Record<string, any> };
type EntityB = { type: 'B', payload?: string[] };
```

Besides the use of literals as types which can be quite the shock to newbies, `A` and `B` are the "tags". While TypeScript does not add tags at compilation, we can add them manually; this make discrimination easy.

```TypeScript
function showPayload(entity: EntityAOrB) {
    switch (entity.type) {
        case 'A': // entity.payload is a Record (or null)
        case 'B': // entity.payload is an array (or null)
    }
}
```

## It collapses

Being untagged means the union type itself is transparent. So the below types are identical.

```TypeScript
type AorB = A | B;
type BorA = B | A;
```

What about the example below?

```TypeScript
type Optional<T> = T | null;

type Optional2<T> = Optional<Optional<T>>;
type Optional3<T> = Optional<Optional<Optional<T>>>;
// and Optional4<T> etc you get the point
```

Well it turns out all three types are identical. This can be proven below.

```TypeScript
const option1: Optional<number> = 1;
const option2: Optional2<number> = option1;
const option3: Optional3<number> = option2;
```

Of course this is hardly ground-breaking, because we can apply "equational reasoning" on type level, by substituting `Optional<T>` in the definition of `Optional2<T>`, 

```TypeScript
type Optional2<T>   == (T | null) | null 
                    == T | null 
                    == Optional<T>
```

## Undecidable

Perhaps the most confusing consequence of untagged unions is they can be undecidable when used for type calculation. Here is a typical TypeScript usage.

```TypeScript
type FooBar = 'foo' | 'bar';

declare function needFoo(v: 'foo'): void;

function fooOrBar<T extends FooBar>(v1: T, v2: T): void {
    if (v1 == 'foo') needFoo(v1);   // OK

    if (v1 == 'foo') needFoo(v2);   // Error  
    // Argument of type 'FooBar' is not assignable to parameter of type '"foo"'.
    // Type '"bar"' is not assignable to type '"foo"'.ts(2345)
}
```

How could this be? `(v1 == 'foo')` already narrows down `v1` to `'foo'`, and `v2` is of the same type as `v1`, surely `v2` is also `'foo'`?

Not really! The trick is `<T extends FooBar>` says `T` can be ANY subtype of `FooBar`, which not only includes `'foo'` and `'bar'`, but also `'foo' | 'bar'`.

While `v1` alone cannot be `'foo'` or `'bar'` at the same time, two values `v1` and `v2` certainly can, and still be of the same type - that's the union type by definition! (This was also discussed previously with [must cast situation](/typescript-must-cast-situation))

This reveals the "undecidable" nature of untagged unions. A very handy example is when type inference kicks in for lack of type annotation.

```TypeScript
function inferred(arb: FooBar) {
    return arb == 'bar' ? 1 : '0';
}

// inf1: 1 | "0"
const inf1 = inferred('foo');
```

This can catch a lot of people by surprise: how could `inferred` return `1 | "0"`? Shouldn't it decide to be `number` and give a compiler error for `'0'` (as a string)?

This is when people will complain that TypeScript is weakly typed. No! It's just untagged!