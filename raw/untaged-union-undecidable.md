Have you heard? TypeScript's union types are untagged.

Untagged unions are not a TypeScript speciality, Python also has untagged unions. But the TypeScript unions are super neat: it lets us freely combine types into new types without the verbosity of writing up new types and constructors; it even allows us to calculate union types from other union types by inspecting types in unions (with `extends` as usual). Completely unheard of!

But with great power comes great responsibility. One of the responsibilities is particularly strange: discrimination. Not on people, but on types.

## A Union is Useless without "Discrimination"

We put two types together to form a union type `type AOrB = A | B`. However, the job is only half done. In practice, for `AOrB` to be useful, we must be able to tell `A` and `B` apart. 

```TypeScript
type AOrB = A | B;

function foo(aorb: AOrB) {
    // if aorb A or B?
}
```

Whatever method we use for "telling apart" is sometimes called the "discriminator". (You'll also come across the term "discriminated union"). Without a proper discriminator, a union type is all but useless.

*Tagging* offers intuitive syntax and discrimination, and is the solution for languages such as Rust or Haskell. Historically dynamic languages typically use "untagged" unions to be backward compatible.

The choice of tagging or untagging can lead to some interesting (if not surprising) differences.

## Tagging

`Maybe` in Haskell is [defined as](https://hackage.haskell.org/package/base-4.17.0.0/docs/src/GHC.Maybe.html#Maybe),

```Haskell
data  Maybe a  =  Nothing | Just a
```

The idea is, when `Maybe` is compiled to its runtime representation, *tags* are generated for both constructors: `Nothing` and `Just`. So when a `Maybe` value comes along, it's easy to discriminate,

```Haskell
valueOrDefault :: a -> Maybe a -> a
valueOrDefault def Nothing = def
valueOrDefault _ (Just a)  = a
```

Don't be fooled into taking `Nothing | Just a` for granted! 

First, these days people are encouraged to equate `Nothing` to `null`. Not so fast! Unlike `null`, which is reserved by the language, `Nothing` is nothing special - it is just normal *tag* (constructor) to the normal `Maybe` type.

But there is more. Did you notice `Nothing` is an empty tag? While it's technically correct to say "tagging" is a way to *create* unions, we shouldn't take this too literally. The tags can have meanings on their own, without containing anything else. `Nothing` is one good example; and empty tags that carry type information ([type witnesses](/typescript-is-no-witness)) can be the real mind-bender.

```haskell
data Witness a where
  WitnessInt :: Witness Int
  WitnessStr :: Witness String
```

Anyway, let's digress no further and focus on the obvious benefits of "tagging": its intuitive syntax makes "discrimination" trivial. It also enables *exhaustive* pattern matching, which goes a long way towards ensuring correctness.

## Untagged, weak?

*Tagging* seems the real deal, so how could there be any need for untagged union? 

Enter TypeScript (JavaScript) who is used to bring order to a historically dynamically language and a sea of untyped code. One of [its design goals](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Design-Goals#:~:text=Impose%20no%20runtime%20overhead%20on%20emitted%20programs.) state,

> Impose no runtime overhead on emitted programs

(This promise has been held up pretty well, maybe with the exception of Enum)

Along this line, TypeScript is designed with structural typing in mind, which roughly means most types are "shapes" more than solid entities or runtime existence. Let this sink in! Because any C# or Java wired brain can be thrown off by the implications of this seemingly innocuous statement.

For one, there is no free tag-based discriminators.

Consider this example,

```TypeScript
type EntityA = { type?: string, payload?: Record<string, any> };
type EntityB = { type?: string, payload?: string[] };

type EntityAOrB = EntityA | EntityB;
```

Do you see the problem here? `EntityAOrB` is a badly designed union type. Actually, it could be useless.

Why? Because it's nearly impossible to write a good **discriminator**! How can we deterministically tell `EntityA` apart from `EntityB`? For example, `{}` is a valid value for either `type`, thanks to lack of tagging and structural typing.

This requirement trips up programmers from C# or Java programmers a lot, who would be looking for `EntityA.GetType() == typeof(EntityA)` to test the type deterministically. (Yes that is possible if all data is `class` - which is not the case and beside the point).

This point again: types are really "shapes", not always solid entities.

Thus we arrive at an easy conclusion: **if for every type in a union, all fields are optional, then the union type cannot be discriminated.**

In practice this example can be fixed in an idiomatic way - adding and enforcing *tags* manually.

```TypeScript
type EntityA = { type: 'A', payload?: Record<string, any> };
type EntityB = { type: 'B', payload?: string[] };
```

Here strings `A` and `B` are the "tags". While TypeScript does not add tags to unions at compilation, we can add them manually; this makes discrimination easy.

```TypeScript
function showPayload(entity: EntityAOrB) {
    switch (entity.type) {
        case 'A': // entity.payload is a Record (or null)
        case 'B': // entity.payload is an array (or null)
    }
}
```

The use of literals as types (and tags) is the catch - it marries up runtime and "code" time perfectly, by inspecting the "shape" of runtime values!

A more subtle bug arises of mixing up sub-typing with union types. Let's say we do love to use `class`, and we have a `Student` class that extends the `Person` class; and we also love union types, so we create a `Customer` type as below.

```TypeScript
type Customer = Person | Student;

function calcDiscount(customer: Customer): number {
    if (customer instanceof Person) {
        return 0;
    } else if (customer instanceof Student) {
        return 10;
    }

    // customer: never
    // The left-hand side of an 'instanceof' expression must be of type 'any', an object type or a type parameter.ts(2358)
}
```

This is a bad *discriminator*, because the `Person` case will forestall the `Student` case. TypeScript actually rejects as it correctly find `customer` to be `never` for the `Student` case.

In practice, it's best to avoid mixing up sub-typing with union types. For the above example, a better design might be making `calcDiscount` a method of `Person`, which can then be polymorphic to its sub-types.

Although TypeScript allows overlapping types within a union, for robustness, a *Disjointed Union* that consists of fully separate types makes the best union. 

## Unions collapse

Being untagged means a union type is transparent. So the below types are identical.

```TypeScript
type AorB = A | B;
type BorA = B | A;

// or even
type AOrBOrA = A | B | A;
```

No surprise, as this is basic behaviour of the "or" operator. What about the example below?

```TypeScript
type Optional<T> = T | null;

type Optional2<T> = Optional<Optional<T>>;
type Optional3<T> = Optional<Optional<Optional<T>>>;
// and Optional4<T> etc you get the point
```

Well it turns out all three are identical. This can be proven below.

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

It still follow the "or" operator. Still, how unions collapse can be a source of convenience - it flattens and reduces types to the simplest form, so we can reason the types with the values.

However, it's also a source of frustration, especially for people who yearn for ways to inspect types with mechanisms such as reflection. 

The "shapes" view prevails: the nested `Optional` types describe the same *shape* (structure), which constrains the same values in runtime. Types are transparent.

## Type of value can be Undecidable

Perhaps the most confusing consequence of untagged unions is when type inference is involved, the type for a value can be undecidable, while it looks very much **decided**! Here is a typical TypeScript program.

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

How could this be? `(v1 == 'foo')` already narrows down `v1` to `'foo'`, and `v2` is of the same type as `v1` (they are both said to be `T`), surely `v2` is also `'foo'`?

Not really! The catch here is `<T extends FooBar>` says `T` can be ANY subtype of `FooBar`, which not only includes `'foo'` and `'bar'`, but also `'foo' | 'bar'` (and `never`, technically!).

While `v1` alone cannot be `'foo'` or `'bar'` at the same time, two values `v1` and `v2` certainly can, and still be of the same type - that's the union type by definition! (This was also discussed previously from different angles in [must cast situation](/typescript-must-cast-situation))

## Final words

We arrive at a simple guide to the use of untagged unions: think first about discriminators when putting types in a union. If we expect the discriminator to be difficult to write, then the union is bad, or, not *blessed* :-)