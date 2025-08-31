In this post we look at a dialect of union type in Kotlin's sealed interface (or class). In particular, how it differs from other prominent variants (for this purpose, Haskell and TypeScript) in ergonomics.

## Union of types, not constructors

A union type is defined as a `sealed interface` (or `sealed class` but I will use `interface` from now on) that is implemented by its member types (there are variations in where the member types can be placed - please see Kotlin docs). Consider the defintion of `Maybe<T>`,

```Kotlin
sealed interface Maybe<T> 
data class Just<T>(val value: T) : Maybe<T>
data object Nothing : Maybe<Nothing>
```

This looks not much more than a verbose version of the intuitive definition in Haskell,

```Haskell
data Maybe a = Nothing | Just a
```

However, there is a notable difference: `Just` in Haskell is one of two data constructors of `Maybe a` (which itself is called a "type constructor"), but it is not a type; while `Just<T>` is a type of its own. Therefore, it's not possible type a value as `Just Int` in Haskell, but completely legitimate in Kotlin as below.

```Kotlin
fun showIncrement(mustBeJust: Just<Int>) {
    println(mustBeJust.value + 1)
}

val just2: Just<Int> = Just(2)
showIncrement(just2)
```

This valuable feature gives Koltin's union types an edge of expressiveness. (Or if you are cynical, yet another chance for confusion and abuse. Being cynical is no fun.)

A Haskeller may compare `Maybe<T>` to type families, such as type promotion of `Just` / `Nothing` via DataKinds, and further question if Kotlin supports type-level programming. The short answer is no - at least not along the lines of DataKinds, or that of TypeScript to effortlessly promote values to types for a flavour of dependent types. The longer answer, however, is one with slight complication.

## Union of singleton types and enums

`Nothing` in Kotlin's `Maybe<T>` is a singleton type - a type with just one value. It allows the seemingly strange expression as below,

```Kotlin
val naught: Nothing = Nothing
println("It is $naught")
```

The telling feature of singleton is, "if you know the type, you know the value". This innocent-looking property can be used in combination with a union type hierarchy to enforce invariants.

```Kotlin
sealed interface SBoolean
data object STrue : SBoolean
data object SFalse : SBoolean
```

To the unsuspecting eyes, `SBoolean` ranges over two single values, it is therefore nothing more than a superfluous alternative to a plain enum. That would be a limited view, because `STrue` and `SFalse` are not just values, but also types, and can be used individually, such as following,

```Kotlin
fun runRiskyOperation(mustHaveAcknowledged: STrue) {
    println("By this point, you have acknowledged.")
}

fun runAtRisk(acknowledgedOrNot: SBoolean) {
    when (acknowledgedOrNot) {
        STrue -> runRiskyOperation(STrue)
        SFalse -> println("Cannot run operation without acknowledgement.")
    }
}
```

In the above example, the risky operation must only be executed with acknowledgement. This is enforced by the use of singleton type `STrue`. The caller has no other options except passing in the only value `STrue`; passing in `SFalse` is rejected by the compiler. 

Had we used type `mustHaveAcknowledged: Boolean`, the caller could rightfully pass in `false`, an illegal state that requires runtime validation to avoid.


 and trivially vice versa (because when a value is constructed, the type is already known).

While the above example is admittedly contrived, in practice 

As a quick recap, unlike a typical interface or base class that models an open set of implementations, a union type models a closed set of member types; unlike an enum type that models enumerable values of the same shape, a union type models enumerable member types of different shapes.

