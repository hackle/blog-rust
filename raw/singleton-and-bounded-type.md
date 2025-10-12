Types range over values. Some types have unlimited values: `String`, `Double`, `List`, `Map`, etc. Others have exact numbers of values: `Integer` type has billions of values, `Byte` has hundreds, `Boolean` has two in `true` and `false`. Then there is the singleton type: a type with exactly one value.

The most important quality of a singleton is, "if you know the type, you know the value". This may appear unsurprising if not borderline boring, but when utilised well, especially in combination with generics, singletons can be great help towards type safety and expressivity.

## Defining a singleton

By far the most popular singleton is the unit type, taking the form of `void` in C# / Java, `()` in Haskell / OCaml / F#, `Unit` in Kotlin etc. Because the precise 1:1 mapping from the type to the value, it's common for to use the same notation for both, resulting in (somewhat funny) expressions such as `val foo: Unit = Unit`. The unit type is somewhat boring. A function `foo : ?? -> Unit` must have side effect to be useful beyond the totally legit but meaningless `return Unit`.

It's more interesting when we define our own singleton types. The definition can vary from the programming languages to languages.

The common "singleton" pattern in the wild can be seen as a manual application, by keeping a static instance of a class and "redirect" any instantiation to that static instance. With a modern language like Kotlin, creating a singleton type is much more streamlined in the form of `data object`, as follows,

```Kotlin
data object Foo {
    val name = "I am foo"
}

val foo: Foo = Foo
```

Just like `Unit`, `Foo` is both a type and a value. Its usage is just like that of `val foo: Unit = Unit`. However, a `data object` can encapsulate arbitrary data, and is therefore more useful.

Typically `data object` is used in place of a `data class` without any parameter, something not allowed by Kotlin. Yet it's allowed by C# for `record`, roughly the `data class` equivalent, as follows,

```C#
record struct Two
{
    public static int Value => 2;
}

var two = new Two();
```

Because the only field `Value` is `static`, and a `record struct` is "sealed", or cannot be extended, by effect, `Two` is a singleton. It may not be as cute as `data object`, but is logically sound without resorting to extra syntax.

Yet a less-known alternative is called "singleton enum", as the name suggests, its an enum type with just one value. For example,

```Kotlin
enum class Two(val value: Int) {
    VALUE(2)
}

val foo: Two = Two.VALUE
```

Compared to `data object`, a singleton enum requires discipline to stay a true "singleton". There is no language-level constraint to stop anyone from adding another value `ALSO(3)`, or indeed, remove the only value so it's empty! 

The advantage for the lack of soundness, the constant values of an enum are enumerable at runtime, in the case of Kotlin, it's with `enumValues<T : Enum<T>>()`, as follows,

```Kotlin
// with kotlinc
>>> enumValues<Two>()
res1: kotlin.Array<Two>
```

By comparison, there is no such preferential treatment for `data object`. This can be the game changer when we want to get the value of an arbitrary singleton.

The singletons so far may look strange but still somewhat conventional. In more expressive type systems, such as that of TypeScript, values can be lifted directly into types, making the creation of singletons almost trivial.

```TypeScript
const onlyTrue: true = true
const mustBeFive: 5 = 5
const fooInBar: { 'bar': { 'foo': 1 } } = { 'bar': { 'foo': 1 } }
```

Here, `onlyTrue` is not just of type `boolean`, but of type `true`, the same as its value, making `true` a singleton. The same goes for `5` and `{ 'bar': { 'foo': 1 } }` (not considering variance of reference equality, so it's a bit of a stretch).

## Using singletons: choice of one

Besides the usual case of using `Unit` (or `()`, `void`) to signal side effects, or globally unique objects as a performance optimisation, or convenience trick, singletons are actually a handy design tool in expressing logical invariants that other types fall short.

One low-hanging fruit is to take advantage of the lack of choice. Consider the following example,

```Kotlin
enum class HasAcceptedTermsAndConditions(val value: boolean) {
    YES(true)
}

fun createAccount(hatac: HasAcceptedTermsAndConditions) {
    // by this point, T&C must have been accepted!
}
```

To call `createAccount`, one must accept terms and conditions. Without using singletons, one may use a parameter `hatac: boolean`, and validate its value must be `true`, otherwise produce an error. Note we cannot default `hatac` to `true`, for legal reasons.

However, knowing that `createAccount` does not take `false` for an answer, why give the choice at all? That's why the singleton enum `HasAcceptedTermsAndConditions` is so handy: it only accepts value `YES(true)`. An explicit choice is given, although not really, yet must be, for legal reasons.

## Using singletons: passing types as values

More advanced usage of singletons are usually tied to generics, or in this case, more fittingly by the other name "parametric polymorphism". When used as type parameters, unlike other types, a singleton type also carries the guarantee of the only value available.

To see that in action, we first need a type `Singleton` as the upper bound to the type parameter. To keep it simple, let's narrow the scope down to integers. See below for `ISingletonInt` in C#,

```C#
public interface ISingletonInt
{
    abstract static int Value { get; }
}

record struct Two : ISingletonInt
{
    public static int Value => 2;
}

// same goes for Three, Four, Five, you name it
```

This is made possible in C# 11 with []"static abstract member methods in interfaces"](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-11.0/static-abstracts-in-interfaces). In our case, the interface is able to specify that any implementing type must have a type level (versus instance level) property `Value`.

Now we can use `ISingletonInt` as a bound to make `FixedSizeList`, 

```C#
public record struct FixedSizeList<TSize, T> where TSize : ISingletonInt
{
    // 1: hide the public constructor and force construction through Create
    public ImmutableList<T> Value { get; init; }
    FixedSizeList(ImmutableList<T> checkedValue) => Value = checkedValue;

    // 2: use the value of the TSize singleton
    public static FixedSizeList<TSize, T>? Create(
        ImmutableList<T> uncheckedValue
    ) =>
        uncheckedValue.Count == TSize.Value ?
        new(uncheckedValue) :
        default;
}

// ok
var listOf2 = FixedSizeList<Two, string>.Create(["foo", "bar"]);

// construction failed - returns null
var listOf2Bad = FixedSizeList<Two, string>.Create(["foo"]);
```

`FixedSizeList` is designed with the smart constructor `Create` (or "factory method"), by hiding the public constructor and forcing the use of `FixedSizeList.Create` so invalid parameters can be rejected with a nullable return type, instead of throwing an exception from the constructor (which is not visible through types!)

The key point here is the use of constraint `TSize : ISingletonInt`, which makes it possible to pass in the required size through `Two` as the type parameter to `FixedSizeList<Two, string>.Create()`, without also requiring the value of `Two`, which would have be a form of duplication!

One big difference between `FixedSizeList<Two, string>.Create` and designs without using singletons, such as `FixedSizeList<string>.Create(2)`, is the former encapsulates the list size in its type, so a value of `FixedSizeList<Two, string>` cannot be assigned as `FixedSizeList<Three, string>`.

Using the same technique, we can design a type `Bounded` that must be constructed with a value within range, as below,

```C#
public record struct Bounded<TLower, TUpper>
    where TLower : ISingletonInt
    where TUpper : ISingletonInt
{
    public int Value { get; init; }
    Bounded(int checkedValue) => Value = checkedValue;

    public static Bounded<TUpper, TLower>? TryMake(int uncheckedValue) =>
            (uncheckedValue >= TLower.Value && uncheckedValue <= TUpper.Value) ?
            new(uncheckedValue) :
            default;
}

// Bounded2To5 is a type alias
using Bounded2To5 = Bounded<Two, Five>;

// ok
var bounded = Bounded2To5.TryMake(2);
// fails to construct - returns null
var boundedBad = Bounded2To5.TryMake(6);
```

## The curious case of Kotlin

Kotlin does not have an equivalent feature to "abstract static member method in interfaces". Indeed, there is no way to encode type-level constraints in an interface - it's meant only for the "instance" level. The traditional "static" methods are created on a `companion object`. As such, there is no direct translation of the C# design to Kotlin. We must find another way around.

To recap, the goal is to have an interface `SingletonInt` that can be used as below,

```Kotlin
interface SingletonInt {
    val value: Int
}

fun <T : SingletonInt> retrieveValue(): Int

// so
val mustBe2 = retrieveValue<Two>().value
```

Without the powerful `T.Value`, how do we retrieve the value of a singleton? If we look at the two main methods of definition, `data object` cannot be enforced as a type-level constraint. It is possible to use an intention-revealing marker interface `MustBeADataObject`, and trust the implementation to be honourable, then we can retrieve the value of a `data object` using reflection.

But if we must use reflection, then it's much simpler to use singleton enums, as follows,

```Kotlin
enum class Two(override val value: Int) : SingletonInt {
    _2(2)
}

// also called `reflect`!
inline fun <reified T> retrieveValue(): Int where T : SingletonInt, T : Enum<T> {
    return enumValues<T>().first().value
}
```

There are a few things to unpack,

1. as pointed out previously, we can only count on discipline that `Two` faithfully implements `SingletonInt`, and has exactly one value. This also means the call to `first()` is intrinsically _unsafe_.
2. unlike C#, Kotlin / JVM removes generic types ("type erasure") at runtime by default, so `reified T` is required to preserve `T` for runtime inspection.
3. the curiously recursive bound `T : Enum<T>` is key to ensuring that `T` is an enum type whose constant values can be enumerated at runtime via `enumValues<T>()`.

Anecdotally, `retrieveValue` can be more formally called `reflect`, the action of retrieving a value from a type. Yes that's the same idea as "reflection", although it's often used way too liberally to be remotely as safe as `first()`.

In short, if we can live with trusting the principled implementations of `SingletonInt`, then there is parity to `FixedSizeList`, as follows,

```Kotlin
data class FixedSizeList<TSize, T> private constructor(
    val value: List<T>
) {
    companion object {
        fun <TSize, T> makeUnsafe(unsafeValue: List<T>) =
            FixedSizeList<TSize, T>(unsafeValue)

        inline fun <reified TSize, T> tryMake(uncheckedValue: List<T>)
            where TSize : SingletonInt, TSize : Enum<TSize> =
            if (reflect<TSize>() == uncheckedValue.size)
                makeUnsafe<TSize, T>(uncheckedValue)
                else null
    }
}
```

The following points need explanation,

1. to make `TSize` available at runtime, it must be `reified`, and the function must be `inline`, however,
2. an `inline` function cannot access the private constructor, so the more explicit smart constructor `makeUnsafe()` is created,
3. the runtime value of `TSize` is retrieved with `reflect()`, a.k.a. `retrieveValue()`.

And the usage of `FixedSizeList` is very similar to that of C#,

```Kotlin
val listOf2 = FixedSizeList.tryMake<SingletonInt._2, Int>(listOf(3, 4))
// FixedSizeList(value=[3, 4])

val listOf2Bad = FixedSizeList.tryMake<SingletonInt._2, Int>(listOf(5))
// null

// !! asserts that listOf2 is not null
val listOf5: FixedSizeList<SingletonInt._5, Int> = listOf2!!
// error: initializer type mismatch: expected 'FixedSizeList<SingletonInt._5, Int>', 
// actual 'FixedSizeList<SingletonInt._2, Int>'
```

If you've come this far, great! The deserved reward is implementing `Bounded` in Kotlin. Enjoy!

## Further reading

Rust has a feature called ["const generics"](https://practice.course.rs/generics-traits/const-generics.html) that allows using constants directly as type parameters, making the above implementations (especially that of Kotlin) fairly unbearable.

Although TypeScript is miles more expressive, for complete type erasure, there is no way to `reflect` the value of a type, without the aide of a runtime value.