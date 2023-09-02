A cynical Object-Oriented programmer is entitled to think that constructors are boring. The mainstream practices, especially with IoC container-based architecture, constructors are broken down to 2 main types: dependency carriers (for "behaviour" classes) and data carriers (for "data" classes). 

These two types usually don't mix: injecting behaviour interfaces and classes is easy: `IFooRepository` for `FooRepository`, `IFooService` for `FooService`; as soon as data is required for behaviour classes, the "simplicity" of IoC breaks down in spectacular fashion - search the internet for questions such as "how to inject a string?" Workarounds or various level of atrocity range from wrapping a string in an interface, or resort to "stringly-typed" surgical injection.

The reason comes down to "count the implementations"? Because a "behaviour" interface like `IFooRepository` mostly likely has only one implementation in `FooRepository`; this leads to deterministic mapping between interfaces and implementations. On the other hand, "data carriers" can have many more implementations - sometimes infinite. Need to inject a `String`? But which `String`? There are infinite number of them! Same goes for function types.

So the "behaviour" world do not mix with the data world. Behaviour classes must be constructed with other behaviour classes. So much for "combine data and behaviour"!

## new()

The purity and strong exclusivity of the "behaviour" world leads to a shocking misconception: calling `new` to construct a behaviour class is considered "bad practice". This is usually explained in the name of "program against interfaces", not "depending on concrete implementation".

This works well with "enterprise" software, as long as the engineers accept (if not also love) the 1:1 mapping between interfaces and implementations. To be honest, they are not missing much - because their constructors are boring.

Occasionally, some programmers do get confused trying to get more flexibility from constructors - even of the boring type!

## Exception in Constructors

One of the typical question is - should I throw an exception in an constructor? It's a controversial topic that even [Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/standard/design-guidelines/constructor#:~:text=%E2%9C%94%EF%B8%8F%20DO%20throw%20exceptions%20from%20instance%20constructors%2C%20if%20appropriate.) weighs in on. 

Most people agree that constructors should only initialise fields, but some ask - what if the values are invalid? Surely an exception is called for?!

Let's not join the mud fights, and take another perspective - exceptions are actually shortcuts to return values. They are the modern GOTOs. When a constructor throws an exception, it is trying to return something different than the type at hand. so `val person = new Person()` can result in two types: `Person | ValidationException`. 

Other people want an alternative: what if a constructor returns `null` gracefully when it fails? These people go on to use "Factory" methods, `val person = Person.Create(...)` returns a `Person` or a `null`.

Already, things are getting more interesting even with the boring type!

## Async constructors

What if some data is not available right away, and needs to be fetched with an async call?

This is especially a problem from using IoC containers: if we wait for the deferred arrival of data, then construct a behaviour class, there are no other options except calling `new`, which the staunch supporter of IoC rejects out of hand.

## Data and Behaviour again

If IoC containers results in separation of data and behaviour by accident, the introduction of structs, data / record types to many mainstream languages is undoubtedly meant to put an the end to the silly idea of "mixing data and behaviour".

A typical data or record class is a premium data carrier - by solving foundational issues such as equality and immutability (on top of cross-cutting concerns such as formatting), we get a sense of rigour from programming. At last!

With rigour comes discipline, which is unsurprisingly viewed by some as inconvenience. Construction of data or record classes usually does not allow leaving any field unaccounted for: a field must be given a value or have a default value.

It's still possible to add behaviour to data classes: the more modern languages offer various options. The mix-and-match kind that allows behaviour from within or without,

- extension methods in C# and Kotlin `static string Address(this Person person) { ... }`
- extensions in Swift `extension Person { func address() -> String { ... } }`

Or, the more radical separation of data and behaviour,

- Receiver in Go, e.g. `func (p Person) address() string { ... }`
- associated function `impl` in Rust `impl Person { fn address(self: &Self) -> String { ...} }`

## new() again, or no more

While `new()` seems to be the default (albeit frowned-up) way of constructing a class, it's never the case for all languages. Python, Kotlin, Swift, Go, Rust, the non-conformists' list goes on

One person's confusion is another's beauty: `val person = Person(...)` obliterates the division of classes and functions. A constructor is a function, right?

## A constructor is a function

Python is cool in agreeing that a constructor is a function, without the interference of `new()`.

```Python
from dataclasses import dataclass
from typing import Callable


@dataclass
class Person:
    name: str

def construct_person(ctor: Callable[[str], Person]) -> Person:
    return ctor("Hackle")

person = construct_person(Person)

print(person)
# Person(name='Hackle')
```

This is a perfect example of "minimal", or "friction-less" syntax - who cares if `Person` is a function or a constructor if it can be called as `Person("Hackle")` and returns a `Person` anyway? This unification of syntax is quite satisfying. Unfortunately the same cannot be said for other languages, even the more "modern" ones.

At least for this example, well thought-out by Python.

## Exceptions again

If the line between constructors and functions can be blurred, what happens to throwing exceptions?

The biggest problem might not be so much about runtime behaviour, but how well-typed and expressive the code can be. This is especially relevant when (even!) Python is getting a pretty decent type system.

While exceptions are usually not type-annotated, Python do support union types, so a constructor and a factory method can be typed quite differently.

```Python
@dataclass
class Person:
    name: str
    
    def with_name(name: str) -> Self | None:
        return Person(name) if name else None


print(Person.with_name(""))
# None

print(Person.with_name("Hackle"))
# Person(name='Hackle')
```

We are getting close to a revelation - but first let's take a detour.

## Literal types

Python follows TypeScript closely to add literal types to the mix. This irks a lot of "mainstream" programmers, because of smacking use of "magic numbers" or "magic strings" in types.

```TypeScript
type Weekend = 'Friday' | 'Saturday' | 'Sunday';

function amHappy(day: Weekend) { return true; }

const happy = amHappy('Friday'); // type error!
```

`amHappy` requires parameter `day: Weekend`. To produce a value of `Weekend` is quite different than a value of `int`, there are ever only 3 possible values!

Now, if we are happy to set aside a few details, one way to look at `Weekend` is that it has 3 constructors: `'Friday' | 'Saturday' | 'Sunday'`. 

But the surprise of the "mainstream" programmer may be unnecessary, after all, the beloved `boolean` type is nothing more than `type boolean = true | false`, and `int` (as in C#) can be thought of as `-2147483648 | -2147483647 | ... | 2147483646 | 2147483647` (by some stretch of imagination). Indeed, the compiler will reject an attempt at "constructing" an `int` with `int num = 2147483648`.

The term "construct" is debatable here, because one can contend there is no "construction" involved. Instead, the literal values already exist before they are "picked" to form a new type. One may counter by being more philosophical - all values exist and are discovered and picked, so nothing is REALLY constructed.

But let's not go there, and bring back the "proper" constructors.

## Union types and constructors

Union of literals are usually mistaken as a perversion of the traditional `enum` - in contrast to modern `enum` as in Swift and Rust which is more of a union type - but it's actually the simplest form of union types. The addition of union types to a language is usually with revolutionary effects, but at the same time is no mean feat. As examples, Kotlin or C# may never get union types, despite noble efforts of simulation, such as Arrow in Kotlin. 

Let's see an example in Python.

```Python
@dataclass
class CreditCard:
    number: str
    pin: str

@dataclass
class Cash:
    amount: decimal
    change: decimal

PaymentMethod = CreditCard | Cash

def format_payment(pm: PaymentMethod) -> str:
    match pm:
        case CreditCard(): return f"Card No. {pm.number} pin {pm.pin}"
        case Cash(): return f"Cash {pm.amount} change {pm.change}"
        case _: raise Exception("Impossible")
```

There are quite a few things to note here,

### deconstruction and pattern matching

When dataclass is used, the guarantee that any field must have a value upon construction is a very strong and very useful one. It lends us the power of "deconstruction" that is symmetric to "construction". 

Now stop to think about it, a conventional imperative constructor that may or may not provide all fields for a class, and may leave some fields uninitialised, cannot provide the same guarantee. 

One point to stress is, flexibility and convenience may bring short-term benefits, but discipline and the strong guarantee that follows can take us much farther.

### acknowledge uniqueness vs force commonality

The `PaymentMethod` would be a pain to model without union types. Look at `CreditCard` and `Cash`, they share no common fields. Any attempt with sub-typing either leads to convoluted ugliness (as with the visitor pattern), or some poor simulation of union types.

Union types allow us to model with full acknowledgement of uniqueness in `CreditCard` and `Cash`. Combined with pattern matching, it's usually possible to have exhaustiveness check - in this case, if a new payment method is added, the branch with `Never` will be triggered, failing type-checking and require the new payment method to be handled. This is typically used as an example in favour of enhanced type safety, that is not easily achieved with sub-typing, or any amount of strategy patterns.

### Constructors again

Let's ask the question again: how do we construct a `PaymentMethod`? The answer is simple: construct either a `CreditCard` or `Cash`.

But this is actually underselling the significance of union types here. Maybe a more revealing question to ask is: can we construct a illegal `PaymentMethod`?

The answer can be quite astonishing: no we cannot, as far as the types are concerned, there is no way to side-step the constraints.

But this is wishful thinking at best, it's still possible to construct an illegal `CreditCard(no="...1000 digits...")`. It's obviously wrong but how do we encode a max length in the type?

## Constrained types, smart constructors

Python library `Pydantic` provides "constrained types".

```Python
class ConstrainedCreditCard(BaseModel):
    number: constr(min_length=13, max_length=16)
    pin: str

cc = ConstrainedCreditCard(number="0000000000000000000", pin="000")
#  pydantic_core._pydantic_core.ValidationError: 1 validation error for ConstrainedCreditCard
# number
#   String should have at most 16 characters
```

However, there is a regression: the type checking happens at runtime instead of "compile" time. Compile time type checking is a big deal - code that can't be type-checked can't be deployed!

There is where most type systems (even the less mainstream ones!) fall short - expressing constrains with types blurs the line between runtime and compile time, not only because it generally requires the type system to have conditionals and iterations, or to be turing-complete, but also because the difficulty of applying typing to runtime values. For example, what if the credit card number is a string provided by the end user through the command line, or a text field in the browser? The type-level solution leads down the road of having parity between types and runtime. This is not easy!

## Factory methods, smart constructors

What hopes do we have if even the cutting-edge type systems fall short? Well, we need to fall back to factory methods anyway.

The consolation is we have delayed the use of factory methods far enough by pushing the envelope; at least factory methods should not be the default.

Flexible module systems (or even visibility modifiers) give rise to interesting patterns comparable to factory methods, amongst them "smart constructors" that hide the lacking original constructor and force the use of more nuanced functions.

```TypeScript
// not exported: cannot be constructed directly
class CreditCard {
    constructor(public readonly no: string, public readonly pin: string) {}
}

// exported: must construct through this function
export function makeCreditCard(
    no: string,
    pin: string,
): CreditCard | Error {
    if (no.length > 19) return Error("Invalid card number!");

    return new CreditCard(no, pin);
}
```

Well, we are not exactly back to ground zero, that would be way too cynical. At least we postponed the usage of factory methods long enough!