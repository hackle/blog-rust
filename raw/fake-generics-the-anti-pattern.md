If you were taken off-guard by my previous post about how [generics should be kept **generic**](/generics-keep-it-generic) (while you really shouldn't be), here is something equally simple, but no less broken.

How many implementations of this function are there? (Of course, without "cheating", as discussed in the previous post).

```CSharp
T Get<T>()
{
    // implementation
}
```

Again this really shouldn't require much hesitation - not that I am any example - although I must admit the question is much better expressed in more fluent type annotations.

```Haskell
makeAnything :: forall a. () -> a

-- this is analogous to the below due to lazy evaluation

anything :: forall a. a
```

Compared to `id :: a -> a`, this is a much taller order: the implementation of `makeAnything :: forall a. () -> a` must be able to create a value for ANY type out of NOTHING. I am not religious, but this sounds very much like what God does. For mere mortals, the answer is simple: there is 0 implementation for the above functions.

Hold on... you could be thinking, but I have used functions like this in real-world production code!

Yes, me too! Surprise surprise. Indeed they are out there, some of them very popular; but I am going to show you they are not REALLY generics as they are not really **generic*; they are different forms of *cheating*. (Whether such implementations are useful - they very possibly are - is yet another topic of discussion).

## getter of everything: your favourite IoC container

Let's start with something that fits the bill perfectly: any of your favourite dependency injector, or IoC (inversion of control) container. Consider this all-too-familiar example,

```CSharp
class CheckoutService
{
    public CheckoutService(
        IDiscountRepository discountRepository,
        IPriceCalculator priceCalculator
    ) {...}
}
```

You will ask, how is this the same to `makeAnything`? It's not like that at all! I know... that's because I didn't bring out the widely denounced "anti-pattern" of calling the injector directly:

```CSharp
// the service locator
var discountRepository = DependencyInjector.GetService<IDiscountRepository>();
```

While this is frowned upon, it reveals what goes on under the hood: dependency injectors promise to create an instance for ANY type `T` in `GetService<T>()`.

Let's put the familiarity aside, and think for a minute: isn't this magical? You ask for ANY type, and `DependencyInjector` knows how to create and "inject" it?!

Of course when something it's too good to be true, it possibly is. `GetService<T>()` ~~lies about~~ exaggerates its ability: it is only able to create or inject things it knows how to create already, otherwise, it can [return `null` or throw an exception](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.dependencyinjection.serviceproviderserviceextensions.getservice?view=dotnet-plat-ext-6.0#microsoft-extensions-dependencyinjection-serviceproviderserviceextensions-getservice-1(system-iserviceprovider)).

Not just that, most dependency injectors will also struggle with this, because they are infinite numbers of implementations (instances) for `string`.

```CSharp
var foo = DependencyInjector.GetService<string>();
```

OK some may argue I must register an instance of `string` so it can be resolved; but the question is - which instance of `string`? Now I must learn the tricks to narrow down which, where and for whom to inject which `string`... hmm, all very fishy.

The real problem is: `GetService<T>()` is the equivalence of `makeAnything :: forall a. () -> a`, and it is a cheat. It is made possible because,

- `T` is used to carried type information for looking up implementations. So `GetService<T>()` should actually be `GetService(Type serviceType)`. At least Microsoft [is honest with the interface](https://docs.microsoft.com/en-us/dotnet/api/system.iserviceprovider?view=net-6.0).
- `GetService<T>()` actually assumes there is a container that maps types to implementations, so its full type should be `GetService<T>(EverythingAboutT eat) where T in Container.InjectableTypes`. Of course this is not possible yet with most main-stream languages (other than TypeScript), if ever.

So, dependency injectors may be popular or even useful, but they can also be terrible liars.

## converting from anything to anything

If you are OK with the notion that `forall a. () -> a` is not implementable, then it would come as no surprise the below `Convert` function is not much different.

```CSharp
U Convert<T, U>(T from)
{
    // maps T to U
}

// or in Haskell syntax
convertAny :: forall a b. a -> b
```

Can ANY type be converted to ANY other type? Absolutely not! And it doesn't take a genius to figure that out. But this does not stop people from making `Convert` every other day, and claiming their `Convert` is better than other `Convert`s. Why? Well, what else than **convenience**?

Taking number types for an example, the usual suspects are already quite a handful: `int`, `int16`, `int64`, `uint`, `float`, `decimal`, `double precision`. Usually we want to convert them to and from `string`. Now, that's already 8 `x_to_string` + 8 `string_to_x` = 16 functions; we also find the need to convert between different number types, so combinatorics kicks in, we need 56 more functions! Dizzying!

Wouldn't it be cool if we can just publish and maintain ONE function for all these conversions? Ta da! `U Convert<T, U>(T from)` is born!

At first sight this looks like a sweet deal for the users, who need only remember one magical function, which seems to work pretty well for most use cases. **Convenient**!

There is but one caveat: while `Convert` happily accepts any type for `T` and `U`, it does not and cannot REALLY know how to meaningfully convert ANY `T` to ANY `U`; What then? Let's take a wild guess, there are two options, it can either

* throw a nice exception, possibly something descriptive, `NotSupportedConvertException`? or,
* return the default value of `U` (which can be `0` for `int` and `null` for a reference type).

Good effort either way, but the problem is - this is **cheating generics**! The promise of *being generic* is broken. What should have been a pleasant compiler type-check, now either leaks into run-time (exceptions), or worse, catches us off guard with surprises (default values)!

For all we know, a more honest type for `Convert` should be

```CSharp
object? Convert(Dictionary<Type, Type> knownConversions, object from, Type to)
{
    // ...
}
```

Kudos again to peeps at Microsoft for being honest, this is actually [the type of `Convert.ChangeType`](https://docs.microsoft.com/en-us/dotnet/api/system.convert.changetype?view=net-6.0). Next time people cry why `ChangeType` is not yet generic? You know why.

## A magic mapper from anything to anything

`Convert` and `ChangeType` are but segue to a more pervasive evil: magic mappers. The type is not much different to `Convert`, actually, it's almost the same!

```CSharp
U MagicMap<T, U>(T from)
{
    // maps T to U
}
```

Except `MagicMap` is even more ambitious: it takes a complex object of type `T`, magically inspects all its fields, and maps to the fields of an object of type `U`. How wonderful!

Staunch defenders of `MagicMap` either do not care about, or get agitated with these questions,

* what if `T` and `U` do not have matching fields? or even,
* what if `T` and `U` do not have any overlap at all?, or
* what if `T` or `U` (for very good reasons) does not expose parameterless constructors?

Well, they would say: these are "anti-patterns", everything should be constructible without parameters. More over, the user should know better: they must use something like `MagicMapper.Configure<T, U>()` to customise mapping between mismatches types `T` and `U`. Such as,

```CSharp
MagicMapper.Configure<Apple, Pear>()
    .MapField(apple => apple.Scent, pear => pear.Fragrance)
    .MapField(apple => apple.Color, pear => pear.Colour);
```

Naturally, if anybody dares to write an independent mapping function `Pear MapAppleToPear(Apple apple)` that's both clear and testable, without using `MagicMapper`, the pull request is immediately rejected for breach of "conventions"; all mapping MUST go through `MagicMapper`. After all, we must prioritise and maintain **convenience**, even at the cost of inconvenience (if not also beauty) of being able to map ANYTHING to ANYTHING else!

## An anti-pattern appears: fake generics

About time I curbed the out-rush of sarcasm :) 

An anti-pattern surfaces throughout the examples,

* generics is used for the convenience of carrying type information, and the facade of being able to handle ANY type 
* the implementation does not live up to the promise of being truly *generic*, therefore
* any type-safety that's typical of *generics* is traded for the seeming convenience and superficial "beauty"

This is what I comfortably refer to as "fake generics".

How to avoid this anti-pattern? And what are the alternatives? People ask. Here is my opinion,

* denounce the magic: if something is too good to be true, then it possibly is
* think twice before trading important qualities and promises such as type-safety for seeming convenience or "beauty"

The detox is also simple: be explicit!

* it's no shame keeping many small, explicit functions: `Float.ToInt()`, `Int.FromString(str)` or `MapAppleToPear()`, or
* it's also fine to follow the example of `object? ChangeType (object? value, Type conversionType)` - plain looking, but upfront about the expectations.

## A better way

The need to improve verbose, menial tasks with elegant expressions cannot be denied; however, misusing generics seems fool's gold. It may look appealing in the beginning, but the appeal rarely lasts.

But the need is real - and it's definitely picked up by language designers. With more modern languages they give us new tools to get that done safely: ad-hoc polymorphism.

Take the task of conversion string to another type. Rust does this perfectly. A uniform interface `from_str` is given for many types.

```Rust
let possibly_an_int = i32::from_str("12")
let possibly_a_float = f32::from_str("12.23")
let possibly_a_bool = bool::from_str("false")

// or
let possibly_an_int = "12"::parse::<i32>()
```

To enable `from_str`, a type must implement trait `std::str::FromStr`, otherwise, the compiler rejects the call.

The big difference is, a trait does not have to be implemented at the time a type is first created ([by "birth"](/abilities-by-birth)); the implementation can be added ("tagged" onto the type) afterwards, or at different modules or code-bases. A type gradually gathers more capabilities, which the compiler happily acknowledges and accepts for type-checking.

These are two types of polymorphism: 

* ad-hoc polymorphism is flexible and nuanced and address the problem: implementations are available for SOME types, not ALL 
* parametric polymorphism (generics) is more rigorous: implementations is meant FOR ALL types, not just SOME

The misuse of generics can be attributed to the lack of ad-hoc polymorphism in mainstream languages. 

But it goes deeper: such misuse is comparable to bad normalisation of database schemas that leave too much room for NULL values; whereas ad-hoc polymorphism is better normalisation, the room for NULL values is ruled out by design. Hence again the saying "it's either a compiler or a database, and compilers are databases".

(Ad-hoc polymorphism is pretty awesome, [take a sneak peek](/ad-hoc-polymorphism) before everyone else!)

## In closing

Calling out "fake generics" gives me no pleasure; it's the growing pain that most of us programmers must go through, as the slow-evolving main-stream toils to catch up under the weight clever concoctions and smart workarounds. Admittedly, it's no easy task to grasp such concoctions and workarounds, but when we finally do, it's even harder to not feel invested and reject them for the better good. 

Until that, the daily struggle!