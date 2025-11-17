(This is a section from my upcoming book "Strong Code : designing mission-critical applications")

There are many ways to understand types and their relationships, but for practical purposes, I find this simple rule of thumb very helpful: count the values. Let's apply this rule to go over some of the less talked about, but very interesting types.

As counting goes, we should start with the type with _zero_ value, the "empty" type. This type is typically built-in in languages with modern type systems. When it's not, the empty type can come as a bit of a surprise. Therefore, let's start by defining our own to get a taste, before sneaking up to the built-in types.

Defining an empty type is not as easy as it sounds: most types have, and need values to be useful. One definition is through an empty enum, as in the below C# snippet,

```C#
enum Empty { }
```

As its name indicates, `Empty` is an enum without any values defined. So, to a variable with the `Empty` type, there is no way to assign a value. How is `Empty` even useful?

With the exception of type casting that defeats the purpose of type safety, it stands to reason that any use case of `Empty` must take advantage of the emptiness. One very cute use case is to create a type `null`. This is not as silly as it sounds. Although types can be nullable in C#, `null` itself is a value, not to be used directly as a type. But with `Empty`, we can make this happen, see below,

```C#
Empty? mustBeNull = null;
```

Try as you may, null is the only possible value for the variable `mustBeNull`. How does it works? Well, much like a simple puzzle, 

1. any nullable type `T?` accepts any value of `T` or `null`,
2. `Empty?` accepts either a value of `Empty` or `null`,
3. `Empty` has no value, so `Empty?` can only hold `null`. Therefore, `Empty?` is equal to the type of `null`.

The cuteness aside, the point of interest is how types and values can be analysed logically, which is no coincidence, because types are effectively propositions, values and programs proofs, as established by the Curry-Howard correspondence.

We shall continue our exploration and analysis with logical rigour. The next experiment is to place `Empty` in the input position, a.k.a. as the type of a parameter to a function. See below,

```C#
void UseRestrictedFeature(Empty stopSign)
{
    // feature under development
}
```

In this case, the function `UseRestrictedFeature` gate-keeps a feature that is still being worked on, and should not be called yet (but let's assume it's valuable to be exposed for the purpose of demonstration or documentation). Conventionally, it's reasonable to use stern comments, scary and descriptive naming, or throwing exceptions at runtime to fend off overly eager users; `Empty` simplifies such tasks; it is logically bullet-proof, and almost elegant: there is no way to construct a value for the parameter `stopSign` of type `Empty`, therefore assurance is given that `UseRestrictedFeature` is not callable - despite being right there in plain sight!

Great. How about using `Empty` as the output type? For example, how can we implement `MakeNothing` below?

```C#
Empty MakeNothing()
{
    // ??
}
```

Because there is no way to construct any value of `Empty` to return, `MakeNothing` cannot return anything (not even a bare `return;` that is still _something_, not nothing). However, it doesn't mean `MakeNothing` cannot be implemented. Many programming languages leave some kind of "loophole", usually found in two forms: throwing exceptions, or infinite loops (or recursion), see below,

```C#
Empty MakeNothingByException()
{
    throw new NotImplementedException("Cannot be implemented!");
}

Empty MakeNothingByInfiniteLoop()
{
    while (true)
    {
        // do something...
    }
}
```

Both implementation are accepted by the type checker. Can you see the commonality between the throwing an exception and looping infinitely? The former jumps away from the current code block, and the latter never terminates; either way, the current function never runs to the point of returning any value, hence the return type of `Empty` is somewhat plausible.

In practice, like many languages, C# allows throwing an exception (or the infinite loop) to fit into any function with _any_ return type without upsetting the compiler. So the question is, what's the type of the _lone_ act of "throw an exception"? 

The answer usually requires the presence of the built-in "empty" type, which is not available in C#, so we need to look at other modern languages, such as TypeScript, and its `never` type. The choice of TypeScript brings other benefits: its support for structural typing makes `never` more interesting than many other languages. For example, we can "rediscover" the `never` type by manipulating other types to arrive at "emptiness", see below for a few examples,

```TypeScript
// the keys of an empty map is also empty
type NoKeys = keyof {}

// a union type with all member types excluded
type Reset = Exclude<'foo' | 'bar', 'bar' | 'foo'>

// an intersection type with no overlap
type NoOverlap = number & string
```

The flexibility of TypeScript may be foreign to some readers, but the logic should be straightforward: each of the three types is equivalent to `never`, because the definition is eventually reduced to the empty type.

Now can see the type of "throw an exception" is actually `never`, as shown below.

```TypeScript
function sayNever(): never {
    throw new Error("never!")
}

// but this is also accepted!
function sayNever(): string {
    throw new Error("never!")
}
```

OK, the bare act of "throw an exception" is clearly of type `never`; but just like C#, it is also of type `string`, or indeed, any other type, even if the execution _never_ gets to the point of returning anything at all! Why?

Practically speaking, we can make sense of this phenomenon in roughly two complementary ways,

1. any attempt to construct a value of `never`, the empty type, must always fail,
2. or, conversely, the value-less empty type is the sub-type of any other type.

Let's start with the easier point. Any function with the power of terminating the current program, or entering an infinite loop, is able to avoid fulfilling the promise made in the return type; in other words, it must fail before returning. 

We may use this analogy: if a program is a small universe, then by `never`, a function indicates the universe is collapsing, so it can claim with some credibility, "what's the point of bothering with the return type if the universe is ending?" Usually, compilers and IDEs are happy to acknowledge such claims - code that immediately follows a `throw` statement is typically flagged as "unreachable".

Another way to make sense of this phenomenon is through sub-typing, namely, the empty type is the sub-type of all other types. Sounds strange? It's actually pretty simple: if type `S` is the sub-type of type `A` and `B`, then the values of `S` should be the intersection of the values of `A` and `B`. Then, what's the intersection of the values of _all_ the types in the universe, known and unknown to us? Clearly, it is non-existent; so the sub-type of _all_ types can only be empty. It's shown above, we don't need to bring in _all_ types to prove this - the intersection of two popular types `number` and `string` is enough to result in `never`, the empty type.

Let's see this through the type annotations. Seeing the exception-throwing function of type `() -> never` is also accepted as `() -> string`, or `() -> T` in any generic `T` (but not the other way around), we can connect the dots to find the "free" casting `freeCast: never -> string`, or `never -> T`; more formally this is stated as `never <: T`, a.k.a. `never` is assignable as any other type.

This function `freeCast` is well known by another name, `absurd`. It's easy to see why: it is a preposterous claim to "make _anything_ from _nothing_". More formally, this corresponds to the logical statement "from falsehood, anything (follows)". Or less formally but more interestingly, "when pigs fly, I will give away ten billion dollars". It's easy to make promises that one doesn't need to keep; but doing that too often can be problematic and ruins the fun - as is the case of throwing exceptions too liberally!

Back to programming reality, the understanding of `never` as the sub-type of all types, is helpful in making sense of many seemingly strange features. For example, in Kotlin, we can use `TODO` to indicate that a function is yet to be implemented, as below.

```Kotlin
fun sayNever(): Nothing = TODO("never!")

fun <T> sayAny(): T = TODO("any!")
```

Newbies to Kotlin may suspect `TODO()` is built-in marker with special treatment. That's not the case upon a closer inspection: `TODO()` is normal function that returns `Nothing`, Kotlin's equivalent to TypeScript's `never`. Guess its implementation? Simply `throw NotImplementedError()`. Just like `never`, `Nothing` is the sub-type of any other type, therefore `TODO()` fits in seamlessly to any function. It's not special at all!

So far, we've tried to reason with `never` from the angle of values, or lack thereof. Sure, It's satisfying to be able to unify exceptions and infinite loops through sub-typing, but given the ugly nature of these constructs, such unification can feel a bit stretched, or (if I am honest) at least takes a bit getting used to. Luckily, such righteous ugliness is not the only reason to use the empty type; in fact, there are elegant ways to use it to express logical inevitability; this is typically done in combination with other types.

For a start, consider this challenge (we'll use Kotlin as the segue has been made): given the standard list type `List<T>`, how do we give type to a function parameter, so any accepted argument for this parameter is guaranteed to be an _empty_ list?

There are many value-level methods, such as validation: checking the size of the list, and throw an exception if it's 0. That'll work, but is boring and ugly for the use of exceptions. Taking advantage of the empty type, the expression of the empty list can be simpler, and more sound. Consider the function `resetState` that resets the state (particularly the "rewards") of a game, as below,

```TypeScript
function resetState(initialRewards: never[]): Reward[]  {
    // some reward may be sprinkled on
    return [newReward, ...initialRewards]
}
```

Firstly, we know that `never[]` is assignable to `Reward[]` because `never` is the sub-type of any other type; but how are we _absolutely_ sure `initialRewards: never[]` must be empty? Well, this is but a simple logical puzzle: for `initialRewards: never[]` to be non-empty, it must have at least one element, which is required to be of type `never`; however, there is no value to be found of type `never`, therefore, `never[]` must always be empty.

In other words, while `never` is void of any value, `never[]` can only have one value, the empty list, which is assignable to any type `T[]`, or used to build bigger lists, while doing its part to enforce good behaviour, as below,

```TypeScript
// The type annotation `never[]` is necessary, or TypeScript infers `any[]`.
const emptyList: never[] = [];
const emptyListOfRewards: Reward[] = emptyList;
const withNewReward: Reward[] = [newReward, ...emptyListOfRewards];

// Argument of type 'Reward' is not assignable to 
// parameter of type 'never'.ts(2345)
// emptyList.push(newReward);
```

We can see while it's perfectly logical to build a list of `Reward[]` from an empty list `never[]` (through an immutable list concat operation), it remains allergic to mutation such as `push(newReward)` which would violate the type `never[]`. The type systems does well to ensure the logical consistency, making it difficult to break the guaranteed emptiness. As an aside, we also see (or keep seeing) new bits of evidence how immutability goes hand-in-hand with stronger typing.

Compared to TypeScript's `never`, `Nothing` in Kotlin is essential in the design of sealed interfaces - a flavour of union types. For example, the popular `Result<V, E>` union type can be defined with two member types, `Success<V>` and `Failure<E>`, as below,

```Kotlin
sealed interface Result<V, E> {
    data class Success<V>(val value: V): Result<V, Nothing>
    data class Failure<E>(val error: E): Result<Nothing, E>
}

val s1 = Result.Success(aUsefulValue)
val e1 = Result.Failure(aHelpfulError)
```

Something clever is on display: the sealed interface `Result<V, E>` does not specify the usage of `V` or `E`, which is deferred to the concrete types, such as `Success<V>`, which implements `Result<V, E>` by selectively using `V` for fields `value`, and sets `E` to `Nothing`. Its meaning? A `Success<V>` value will never contain an "error"; similarly, `Failure<E>` will not have any "success" value. The mutually exclusive _invariant_ is guaranteed by the types, instead of making `value` and `error` both nullable, and ensuring the invariant with runtime null checks and throwing exceptions. 

You would have guessed, there is no value of type `Result<Nothing, Nothing>`, but that's an inevitability of using `Nothing` twice, but because there is no such member type in `Result<V, E>`; it's perfectly fine to add a such a third member type that uses neither of `V` or `E`.

Because `Nothing` descriptively expresses "no value", it leads to a popular pattern of error-modelling, as below,

```Kotlin
sealed interface PaymentResult<out T>

data class OK(val cfm: Confirmation): PaymentResult<Confirmation>
data class Rejected(val reason: Rejection): PaymentResult<Nothing>
data class Timeout(val elapsed: Duration): PaymentResult<Nothing>

fun makeFakePayment(): PaymentResult<Nothing> {
    TODO("this must not succeed")
}

val notAlwaysSuccess: PaymentResult<Confirmation> = Timeout(TimeoutError)
```

The pattern lies in the choice of `T` in each member type of `PaymentResult<out T>`: only the success type exposes `Confirmation` through `T`, the "failure" types simply pick `Nothing` instead of more specific type of the contained error.

This dichotomy by choice is intention-revealing: by returning `PaymentResult<Nothing>`, `makeFakePayment()` must produce a "failure" type, because success would require the return type to be `PaymentResult<Confirmation>`.

So does `PaymentResult<Confirmation>` always indicate success? Not necessarily. Remember `Nothing` is the sub-type of `Confirmation`, so `PaymentResult<Nothing>` is assignable to `PaymentResult<Confirmation>` (note the "assignability" is enabled by the use of co-variance in `out T`). To precisely indicate success, one must use the `OK` member type.

Despite the popular pattern, it's inaccurate and unhelpful to equate `Nothing` to errors. Consider the exercise of modelling how different activities suit different weather and mood, as below,

```Kotlin
interface Weather
interface Sunny : Weather
interface Rainy : Weather

interface Mood
interface Dark : Mood
interface Bright : Mood

// combination of weather and mood
interface SunnyAndBright : Sunny, Bright
interface RainyAndDark : Rainy, Dark

interface Suits<out T>

// each activity suits different weather and mood
data object KiteFlying : Suits<SunnyAndBright>
data object Pool : Suits<RainyAndDark>
```

For brevity we use _empty_ interfaces to represent different weather and mood, and compose them with more empty interfaces; each empty `data object` (again for brevity) suits different weather and mood. The choice of rainy and dark for pool is largely speaking for myself!

Then we found there are activities that suit almost any weather, mood, time, companion, or food. Such as watching a movie. How could that be expressed? Of course we can combine all conditions into a single interface, or, we can simply use `Nothing`, as below,

```Kotlin
data object Movie : Suits<Nothing>

val rainyActivity : Suits<Rainy> = Movie
val sunnyActivity : Suits<Sunny> = Movie

// Any doesn't work!
data object Film : Suits<Any>
// initializer type mismatch: expected 'Suits<Bright>', actual 'Film'.
// val brightActivity: Suits<Bright> = Film
```

This works because - now you know as much as I do - `Nothing` is a sub-type of any other type. In this case, it definitely does not indicate errors!

If you had the thought of using `Any` in the place of `Nothing`, it won't work, although `Suits<Any>` sounds much more intuitive than `Suits<Nothing>`. It is through such seeming contradictions that programming shows its true colours as a logical exercise rather than a literary one.