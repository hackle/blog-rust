The keyword `extends` seems to be a big source of confusion for many TypeScript users. It's used for inheritance, generics upper bounds, conditional types - which feature the most confusing of all, distributive pattern matching on union types.

## Inheritance & sub-typing

Much like in Java, `extends` is used to create subtypes. Possibly the most popular usage of this keyword, still, there are things to note. 

The common features,

* a class can extend (only) another class
* an interface can extend one or many interfaces

The astonishing,

* an interface can also extend a class! 

[See the handbook](https://www.typescriptlang.org/docs/handbook/interfaces.html#interfaces-extending-classes). Note how the interface will get even the private fields from the class? Talk about tight-coupling. I wonder if this is the reason then newer version of the handbook does not talk so effusively about this "feature".

## Generics constraint, upper bound

Slightly more advanced, `extends` is used with generics to specify the upper bound of a generic type (Also quite similar to the Java syntax!). Consider,

```TypeScript
interface Named { name: string }

function greet<T extends Named>(named: T): string {
    return `Hello ${named.name}!`;
}

greet({ name: 'Hackle', city: 'Auckland' });
greet({ name: 'Computer', cost: 1300, currency: 'NZD' });

greet({ firstname: 'Hackle' }); // Argument of type '{ firstname: string; }' is not assignable to parameter of type 'Named'.
```

Here `T extends Named` specifies that `T` must satisfy the constraint, or, be a sub-type of `Named`(which is a succinct way of saying it must implement `Named`).

This is otherwise called "upper bound", in contrast to "lower bound", a more obscure feature that is implemented in Java.

I am being intentionally succinct with the intro, but please be aware sub-typing combined with product and sum types can give rise to much confusion. Consider this,

```TypeScript
function amHappy<T extends 'Saturday' | 'Sunday'>(day: T): true {
    return true;
}

amHappy('Saturday');
amHappy('Sunday');

declare const friday: 'Saturday' | 'Sunday' | 'Friday';
amHappy(friday);  // Argument of type '"Saturday" | "Sunday" | "Friday"' is not assignable to parameter of type '"Saturday" | "Sunday"'.
```

How is `{ name: 'Hackle', city: 'Auckland' }` a sub-type of `{ name: string }`, but `'Saturday' | 'Sunday' | 'Friday'` not a subtype of `'Saturday' | 'Sunday'`? 

The trick is to "count the elements, not the fields", which I'll try to cover separately.

## Conditional types

We enter the fancy realm of conditional types, in my understanding, a form of dependent typing.

Consider,

```TypeScript
// NOTE the "strings" are actually literal types!
type IsNumber<T> = T extends number ? "It's a number" : "It's not a number";

const v1: IsNumber<number> = "It's a number";
const v2: IsNumber<string> = "It's not a number";
const v3: IsNumber<string> = "It's a number";   // Type '"It's a number"' is not assignable to type '"It's not a number"'.ts(2322)
```

It's tempting to equate such use of `extends` as `equals`. Well, doesn't TypeScript want us to do so, or why the ternary operators?

It does seem intuitive to think the above as `T == number ? "It's a number" : "It's not a number"`. But no, this is problematic, because of none other than union types.

## Conditional types with union types

Consider this example: should `v3` be restricted to `false`, as `Funday` does not equal `Weekend`?

```TypeScript
type Weekend =  'Saturday' | 'Sunday';

type IsWeekend<T> = T extends Weekend ? true : false;

type Funday = 'Friday' | 'Saturday' | 'Sunday';

const v3: IsWeekend<Funday> = ?? take a guess
```

This is exactly why the intuition of `Funday == Weekend ? true : false` fails us, as TypeScript computes the type of `v3` to be `boolean` (or `true | false`), how? Enter [Distributive Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types).

In this example, each sub-type of `Funday`, namely `'Friday' | 'Saturday' | 'Sunday'`, will be applied to `extends Weekend ? true : false` individually, then, the result types of these 3 computations, `false | true | true` are combined into the final type: `boolean`. 

It's also possible to prevent such distribution. As a more advanced topic it's left at the end.

## Type Inference with extends infer

Type inference is one of the distinguishing features of TypeScript. Fair to say it's unheard of in other mainstream languages.

Consider this example - parameters to a variadic function can be `infer`red.

```TypeScript
type FuncParams<T> =
    T extends ((...params: infer P) => unknown) ? P : never;

declare function fives(n: number, d: string): void;

// p1: [number, string]
const p1: FuncParams<typeof fives> = [1, "s"];
```

## Type Inference with extends infer and extends

To really get the money's worth out of `extends`, TypeScript designers allow us to nest `extends infer extends`.  Consider this `CSV` type that turns words into command-separated values. This examples also shows us it's pretty easy to nest ternaries in conditional types.

```TypeScript
type CSV<T extends string[]> =
    T extends [] 
        ? never
        : T extends [infer U extends string]
            ? `${U}`
            : T extends [infer U extends string, ...infer R extends string[]]
                ? `${U},${CSV<R>}`
                : never;

const csv1: CSV<['apple', 'banana', 'pear']> = 'apple,banana,pear';
```

Try to remove `extends string` from `infer U extends string`, TypeScript will complain that `U` is not fit for `${U}`, although it obviously is a `string`. 

## Stop distribution with []

As promised, a more advanced section: what if we do want to compare union types with `extends`?

A less known technique to stop the distributive behaviour is to put `[]` around the types being compared. Using the same example,

```TypeScript
type IsWeekendExactly<T> = [T] extends [Weekend] ? true : false;

const v5: IsWeekendExactly<Funday> = false;
const v6: IsWeekendExactly<Funday> = true;  // Type 'true' is not assignable to type 'false'.ts(2322)
```

Pretty cool isn't it? But how does this work?

This works because `[T]` forms a tuple or fixed-sized list, for which `T` is invariant; or, `T` in `[T]` MUST not vary in either sub-type or super-type direction.

This leads to variance (again!). So the `[T]` trick can also be written in `IsWeekendExactlyInvariant`, yes, it's more verbose, but with this more canonical example, we can explore the relationship between `extends` and variance minutely.

```TypeScript
type IsWeekendExactlyInvariant<T> = ((o: T) => T) extends ((o: Weekend) => Weekend) ? true : false;

const v7: IsWeekendExactlyInvariant<Funday> = false;    // super-type, NOT OK
const v9: IsWeekendExactlyInvariant<'Sunday'> = true;  // error: sub-type, NOT OK
const v8: IsWeekendExactlyInvariant<'Saturday' | 'Sunday'> = true;    // exactly the same type, OK


type IsWeekendExactlyCovariant<T> = (() => T) extends (() => Weekend) ? true : false;

const v20: IsWeekendExactlyCovariant<Funday> = false;
const v22: IsWeekendExactlyCovariant<Funday> = true;  // error: super-type, NOT OK
const v21: IsWeekendExactlyCovariant<'Saturday'> = true;    // sub-type, OK


type IsWeekendExactlyContravariant<T> = ((o: T) => void) extends ((o: Weekend) => void) ? true : false;

const v31: IsWeekendExactlyContravariant<Funday> = false;   // error: sub-type, NOT OK
const v32: IsWeekendExactlyContravariant<Funday> = true;  // super-type OK
```

This further explains why `T` in `[T]` is invariant: because for functions of `Array`, e.g. `[1, 2].push(3)` and `[1, 2].pop()`, `T` appears in both co- and contra-variant positions, as it's not possible to vary **both** ways, `T` must be **invariant**.

## In closing

A "good-enough" intuition to have may be, `A extends B` stands for `A is a sub-type of B`. This does approximately satisfy all use cases of `extends`. However, the nuances with each use case can still be a handful. "The devil is in the details".