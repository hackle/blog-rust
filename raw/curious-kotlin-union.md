In this post we look at a dialect of union type in Kotlin's sealed interface (or class). In particular, how it differs from other prominent variants (for this purpose, Haskell and TypeScript) in ergonomics.

## union of types, not constructors

A union type is defined as a `sealed interface` (or `sealed class` but I will use `interface` from now on) that is implemented by its member types (there are variations in where the member types can be placed - please see Kotlin docs). Consider the definition of `Maybe<T>`,

```Kotlin
sealed interface Maybe<T> 
data class Just<T>(val value: T) : Maybe<T>
data object None : Maybe<Nothing>
```

This looks not much more than a verbose version of the intuitive definition in Haskell,

```Haskell
data Maybe a = Nothing | Just a
```

(Note `Nothing` in Haskell is a data constructor, but Kotlin's `Nothing` the built-in "bottom" type.)

However, there is a notable difference: `Just` in Haskell is one of two data constructors of `Maybe a` (which itself is called a "type constructor"), but it is not a type; while `Just<T>` is a type of its own. Therefore, it's not possible type a value as `Just Int` in Haskell, but completely legitimate in Kotlin as below.

```Kotlin
fun showIncrement(mustBeJust: Just<Int>) {
    println(mustBeJust.value + 1)
}

val just2: Just<Int> = Just(2)
showIncrement(just2)
```

This valuable feature gives Kotlin's union types an edge of expressiveness. (Or if you are cynical, yet another chance for confusion and abuse. Being cynical is no fun.)

A Haskeller may compare `Maybe<T>` to type families, such as type promotion of `Just` / `Nothing` via DataKinds, and further question if Kotlin supports type-level programming. The short answer is no - at least not along the lines of DataKinds, or that of TypeScript to effortlessly promote values to types for a flavour of dependent types. The longer answer, however, is one with slight complication.

## union of singleton types and enums

`Nothing` in Kotlin's `Maybe<T>` is a singleton type - a type with just one value. It allows the seemingly strange expression as below,

```Kotlin
val naught: None = None
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

Kotlin's syntax also clearly indicates the unification of types and values - instead of `is STrue` for type inspection, the value `STrue` is pattern-matched on directly.

The same type hierarchy can also be expressed with singleton enums - you guessed it, a single enum is an enum with just one value.

```Kotlin
sealed interface SEBoolean { val value: Boolean }
enum class SETrue(override val value: Boolean) : SEBoolean { TRUE(true) }
enum class SEFalse(override val value: Boolean) : SEBoolean { FALSE(false) }
```

The enum variation has an advantage over the singleton objects: it allows encoding extra information in the singleton values, in this case, mapping enum constants to the corresponding booleans. One use case is to use the encoded boolean value as runtime value, such as for serialisation and deserialisation (consider `@JsonValue` / `@JsonCreator` with the Jackson library). Data objects typically require some level of arm-twisting to get deserialised.

## yet no dependent types

From singleton types one would be tempted to encode the likes of Peano number as well as its operations including addition, subtraction etc, but that's where the line is drawn. While it's trivial to express `decrement`, there is no way to express addition of two types.

```Kotlin
sealed interface Nat
data object Zero : Nat
data class Succ<T : Nat>(val pred: T) : Nat

// easy - it's just destructuring
fun <T : Nat> decrement(n: Succ<T>): T = n.pred

// not possible
// fun <T1 : Nat, T2: Nat> add(n1: T1, n2: T2): Add<T1, T2>
```

## exhaustive pattern-matching and unification of member types

The real power of union types does not lie in modelling a hierarchy of types with different shapes - the good-old interface is more than enough for that job. Instead, it's in modelling a closed type hierarchy that is _known_ at compile time, and what follows the _closedness_: the ability to analyse such hierarchy exhaustively.

Consider the use of `Maybe` in the slightly revised `runAtRisk`,

```Kotlin
fun runAtRisk(acknowledgedOrNot: SBoolean) {
    when (acknowledgedOrNot) {
        STrue -> runRiskyOperation(STrue)
        else -> println("Cannot run operation without acknowledgement.")
    }
}
```

The use of `else` (the equivalent to wildcard `_` in other languages) may seem harmless, but it is a terrible idea, because it throws away the benefit of exhaustive pattern matching. Would we add a new member type `SUndecided` alongside `STrue` and `SFalse`, the previous implementation of `runAtRisk` fails to compile, rightfully and expectedly, for not handling the new scenario, whereas this version happily ignores the new addition, resulting in undesirable behaviour - treating "SUndecided" as "SFalse". It is therefore recommended to forbid the use of `else` with union types. With Kotlin, this is usually done with the Detekt rule [ElseCaseInsteadOfExhaustiveWhen](https://detekt.dev/docs/next/rules/potential-bugs/).

However, for the extra flexibility afforded by the union of member types (versus just different constructors as in Haskell), at times we want to differentiate a subset of the member types. Consider the example of `PayResult<T>`,

```Kotlin
sealed interface PayResult<out T : Payment> {
    data class Success<P : Payment>(val value: P) : PayResult<P>

    data class NotEnoughBalance(
        val minimum: Long
    ) : PayResult<Nothing> {
        val errorMessage = "Not enough balance."
    }

    data class Unauthenticated(
        val serverErrorCode: ErrorCode
    ) : PayResult<Nothing> {
        val errorMessage = "Authentication failed."
    }
}
```

(Note that the placement of `errorMessage` inside the data classes is intentional: it should not be exposed through the constructor as a free-form String, but closed off and locked down, to prevent nonsense input such as "divided by zero").

When handling an instance of `PayResult`, there would be need to extract any potential error message for display. One may implement `extractError` as following,

```Kotlin
fun extractError(payResult: PayResult<Cash>): String? =
    when (payResult) {
        is PayResult.Success -> null
        is PayResult.NotEnoughBalance -> payResult.errorMessage
        is PayResult.Unauthenticated  -> payResult.errorMessage
    }
```

Which is not terrible, and would be expected of equivalent code in Haskell or Rust. It's often the case a new adapter feels peeved by the size as well as the boring nature of the `when` expression, and tries to improve or "abstract" it, such as by introducing a map; or faced with a union type with a few more member types, attempts to find shortcuts to make the code shorter and "cleaner". Watch out - this is usually a slippery slope. Such smart workarounds usually undermines the guarantee provided by union types; it's a regression in correctness.

Dealing with union types (or modern type systems) require a change of mindset. As a rule of thumb, "smart" code that degrades type-checking to runtime behaviour, or results in regression of type safety should be avoided; seemingly "dumb" code with the blessing of the type system is more preferable. (An attractive deal sweetener is well-type code is easier for the modern language servers or IDEs to analyse, often seen through high-quality auto-completion).

With that said, there is always room to demand more. In our case, one can find 2 reasons to be critical,

1. the repetition in `payResult.errorMessage`. Unlike TypeScript, Kotlin is _mostly_ not structured typed, and cannot figure out the presence of the common field;
2. more subtly, it makes no sense to call `extractError` from `PayResult.Success` - there is no "error" to speak of! This forces the use of `String?` as the return type. While one may guess that `Success` will result in `null`, from the types along, there is no stopping `null` for `NotEnoughBalance` too. In other words, the return type is _polluted_; the caller's hands are also forced to have to check for null.

Ideally, as its name states, `extractError` should only accept member types that encode errors. But that poses the challenge of separating `Success` from the rest of the "error" member types. 

One may take hint from the `T` in `PayResult<T>`, and try to unify `NotEnoughBalance` and `Unauthenticated` as `PayResult<Nothing>`, but this only gets us half-way as follows,

```Kotlin
fun extractErrorSafe(payResult: PayResult<Nothing>): String =
    when (payResult) {
        is PayResult.NotEnoughBalance -> payResult.errorMessage
        is PayResult.Unauthenticated  -> payResult.errorMessage
        is PayResult.Success -> "Impossible"
    }
```

Unlike TypeScript, Kotlin does not go the extra mile to filter out `Success` for `PayResult<Nothing>`, so although `extractErrorSafe` _cannot_ be called with `Success`, its implementation must still check the success case, resulting in an "impossible" branch.

On the other hand, it's fairly straightforward to use a "normal" interface to unify the "error" member types. See `HasErrorMessage` as below,

```Kotlin
interface HasErrorMessage {
    val errorMessage: String
}

sealed interface PayResult<out T : Payment> {
    data class Success<P : Payment>(val value: P) : PayResult<P>

    data class NotEnoughBalance(
        val minimum: Double
    ) : PayResult<Nothing>, HasErrorMessage {
        override val errorMessage = "Not enough balance."
    }

    data class Unauthenticated(
        val serverErrorCode: ErrorCode
    ) : PayResult<Nothing>, HasErrorMessage {
        override val errorMessage = "Authentication failed."
    }
}

fun extractErrorSafe(withErrorMessage: HasErrorMessage): String =
    withErrorMessage.errorMessage
```

`HasErrorMessage` makes `extractErrorSafe` superfluous - it simply calls through to `withErrorMessage.errorMessage`; on the other hand, we can see how the "error" types are unified in an exhaustive `when` expression as follows,

```Kotlin
fun makeDisplayMessage(payResult: PayResult<Cash>) =
    when(payResult) {
        is PayResult.Success -> "All paid!"
        is PayResult.NotEnoughBalance,
        is PayResult.Unauthenticated,
            -> payResult.errorMessage
    }
```

Yet another trick is to make `HasErrorMessage` also sealed, so the above `when` block can be "simplified" as below,

```Kotlin
fun makeDisplayMessage(payResult: PayResult<Cash>) =
    when(payResult) {
        is PayResult.Success -> "All paid!"
        is HasErrorMessage -> payResult.errorMessage
    }
```

The sharp reader would immediately find this to be a bad idea - because this "simplification" is little better than using `else` - if a new "error" type is added to `PayResult`, this version of `makeDisplayMessage` will happily _ignore_ the new addition, and throw away the strong guarantee of exhaustive pattern-matching.

## "inheritance" / extending a union type

Unlike a normal interface, a sealed interface is closed at the time of definition, strictly speaking, together with all its member types, which are all known at compile-time. This property of closedness applies to any union types, and is what makes exhaustive analysis possible. 

However, without the constraint of "tagging", untagged unions as in TypeScript of Python can be extended to make a new union type - which are separate from the original, but with additional member types. This is also possible with Kotlin's sealed types through a form of inheritance, due to the use of interfaces.

Let's suppose we want to extend `PayResult` with a new member type `SuspectedScam`, to make a new union type `CreditCardPayResult`, which has dedicated use in only _part_ of the application, while keeping the existing use of the original `PayResult` undisturbed. What could this be done?

The naive answer is to make `CreditCardPayResult` extend `PayResult` directly, as follows,

```Kotlin
sealed interface CreditCardPayResult<out T : Payment> : PayResult<T> {
    data class SuspectedScam(
        val probability: Float
    ) : CreditCardPayResult<Nothing>, HasErrorMessage {
        override val errorMessage = "Watch out! Likely a scam!"
    }
}

// error: 'when' expression must be exhaustive. 
// Add the 'is SuspectedScam' branch or an 'else' branch.
fun makeDisplayMessage(payResult: PayResult<Cash>) =
    when(payResult) {
        is PayResult.Success -> "All paid!"
        is PayResult.NotEnoughBalance,
        is PayResult.Unauthenticated,
            -> payResult.errorMessage
    }
```

Unexpectedly, this upended existing use of `PayResult`. Why? That's because Kotlin scans for any sub-type of `PayResult` to discover the closed hierarchy, a.k.a. the _union_; by extending `PayResult`, `CreditCardPayResult` and in turn `SuspectedScam`, is considered a member type of the union! This is how sealed types work, and it's not surprising at all.

The solution is a bit of a brain-twister: to reserve the relationship, by making `PayResult` extend `CreditCardPayResult`, as follows,

```Kotlin
sealed interface PayResult<out T : Payment> : CreditCardPayResult<T> {
    // left unchanged
}

sealed interface CreditCardPayResult<out T> {
    data class SuspectedScam(
        val probability: Float
    ) : CreditCardPayResult<Nothing>, HasErrorMessage {
        override val errorMessage = "Watch out! Likely a scam!"
    }
}
```

This setup achieves exactly what we set out to do, as is seen below,

```Kotlin
fun makeDisplayMessage(payResult: PayResult<Cash>) =
    when(payResult) {
        is PayResult.Success -> "All paid!"
        is PayResult.NotEnoughBalance,
        is PayResult.Unauthenticated,
            -> payResult.errorMessage
    }

fun makeDisplayMessage(payResult: CreditCardPayResult<Cash>) =
    when(payResult) {
        is PayResult.Success -> "All paid!"
        is PayResult.NotEnoughBalance,
        is PayResult.Unauthenticated,
        is CreditCardPayResult.SuspectedScam,
            -> payResult.errorMessage
    }
```

Why does this work? It is because the original hierarchy of `PayResult` is kept undisturbed - its number of sub-types is still exactly _three_. On the other hand, `CreditCardPayResult` has _four_ sub-types, `SuspectedScam` that implements it directly, and indirectly, the 3 member types of `PayResult`.

In other words, extending or implementing a type results in the creation of a sub-type, which may have "more" behaviour, but as a type, it has _fewer_ values or member types, as is the case with `PayResult`. On the other hand, the super-type `CreditCardPayResult` ranges "larger" and has _more_ values and member types. From this perspective, there is nothing surprising at all.