First we see `"foo" + "bar" == ["foo", "bar"]`, then `"foo" + "bar" == False`. What?!

Yes indeed! If we are using a language like Rust or Haskell. The same expression ``"foo" + "foo"`` can return either a boolean or a list. This is ad-hoc polymorphism at its best (or worst, depending on your view) messing with us!
(Read on for an implementation of this strangeness).

# Polymorphism Recap

Polymorphism usually appears magical when we first get to know them.

For example, let's look at subtyping.

```CSharp
interface Animal { ... }
class Tiger : Animal { ... }
class Cow : Animal { ... }

// somewhere else there is a method

void Feed(Animal animal) {
    animal.Feed(food);
}
```

Is the `animal` parameter a `Tiger` or a `Cow`? The point is, it could be either, and the `Feed` method shouldn't care as long as its implementation is concerned. `animal.Feed()` could be invoking a harmless `Cow.Feed()` that results in shortening of grass, or `Lion.Feed()` that results in loss of life of another animal. This big attitude of "don't know, don't care" is fully endorsed by "polymorphism", and is further supported by famous idea like the Liskov Substitution Principle (in my opinion the only principle in SOLID with any substance). Subtyping is really flexible, and is easily abused by drunk programmers. 

**Parametric polymorphism** or generics allows us to define operations over "structures" instead of specifics of element types. Consider `filter : (T -> bool) -> [T] -> [T]` in JavaScript,

```JavaScript
const odds = [1, 2, 3].filter(n => n % 2 == 0);
const caps = ['A', 'b', 'C'].filter(c => c >= 'A' && c <= 'Z');
```

There needs ot be only one implementation of `filter`, but this one implementation can handle a list of number, string or really any type. There is the same big attitude: its implementation knows nothing, nor does it care about the type of the elements of the list. This intentional ignorance can't be a bigger blessing; it gives rise to amazing things like [theorems for free!](https://www.google.com/search?q=theorm+for+free&rlz=1C5CHFA_enNZ878NZ878&oq=theorm+for+free&aqs=chrome..69i57j0i13j0i22i30l4.2885j0j4&sourceid=chrome&ie=UTF-8). 

Worth mentioning, combining subtyping and parametricity gives rise to some appalling patterns: overly generic `IRepository<T>`, `IQuery<T>` or `IHandler<T>`, together with dependency injectors, are reasons behind some of the worst "abstractions" especially in the C# world.


# Ad-hoc Polymorphism is no stranger

Let's not linger and get to the subject: Ad-hoc polymorphism is no stranger to us - in any language with more nuanced numeric types than JavaScript, it's common to use the same operator `+` for addition. In C# for example,

```CSharp
Console.WriteLine((1 + 2).GetType());   // System.Int32
Console.WriteLine((1.5 + 2.5).GetType());   // System.Double
```

We may have been taking it for granted, but `+` is polymorphic over integers and floats. Of course the case is made more clear by `DateTime.Now + new TimeSpan(0, 0, 1)` where it works on `DateTime` and `TimeSpan`. **Operator overloading** is widely supported across many languages. It's not exclusive for static-typed languages either - Python has it through special functions like `__add__`. The honorary mention goes to Java as one of the exceptions.

A change of attitude is witnessed here: although the `+` operator can be applied to different types of values/operands, warranting its polymorphic status, it needs to know, and cares quite dearly what combinations the operands are qualified. For example, `Date + number` is reasonable, but `Date + Date` makes very little sense.

# Object Orientation fools me

Here, object orientation and "has-a" thinking runs deep. I've always (if somewhat subconsciously) held the belief that such operations must be defined on the "receiver", or the class that holds the method. As in Python, `__add__` is defined as an instance method; in C# is static which makes more sense, but it has to belong in a "class" even in this case it's just a namespace, and never a standalone declaration. For example [this definition](https://github.com/microsoft/referencesource/blob/5697c29004a34d80acdaf5742d7e699022c64ecd/mscorlib/system/datetime.cs#L1485),

```CSharp
struct DateTiem {
    static DateTime operator +(DateTime d, TimeSpan t) { ... }
}
```

Let's say this is more or less justified. `DateTime` owns the `+` operator; After all, `new TimeSpan(0, 0, 1) + DateTime.Now;` makes less sense, and rightfully it won't work for "error CS0019: Operator '+' cannot be applied to operands of type 'System.TimeSpan' and `System.DateTime'".

Functional programming really throws in a monkey's wrench here. It's more advisable to keep data and behaviour separate, not to mix them; "has-a" relationship is dialed down. Operator overloading works very much the same, consider `+` in Rust ([In full](https://doc.rust-lang.org/rust-by-example/trait/ops.html)).

```Rust
impl ops::Add<Bar> for Foo {
    type Output = FooBar;

    fn add(self, _rhs: Bar) -> FooBar {
        println!("> Foo.add(Bar) was called");

        FooBar
    }
}

fn main() {
    println!("Foo + Bar = {:?}", Foo + Bar);
}
```

Not much of a difference is there? Not really, not yet.

# Has-a? Part of!

Now let's bring on the code for the opening example. Consider "class" and "instance" equivalences of "interface" and "class" in C#/Java.

```Haskell
{-# Language MultiParamTypeClasses, FlexibleInstances #-}

import Prelude hiding ((+))

class Strange a b where
  op :: a -> a -> b

instance (Eq a) => Strange a Bool where
  op = (==)

instance Strange a [a] where
  op x y = [x, y]

(+) :: Strange a b => a -> a -> b
(+) = op
infix 1 +

main = do
  print $ True == ("foo" + "bar")
  print $ "baz" : ("foo" + "bar")
```

This again may look quite natural, but only because Haskell makes it seem so. The essence is in how we are allowed to define the `+`/`op` operator in terms of the operands AND the result: one instance has `a + a = Bool` and the other `a + a = [a]`!

You'd be forgiven to think this goes against purity: for the same input, `+` should give the same output. Right? Right? (Think the famous meme here). The definition clearly says so?

Most certainly not, it's just a matter of perspective. Let's look at a simpler "sighting" of ad-hoc polymorphism in Rust.

```Rust
fn main() {
    let x = "3".parse().unwrap();
    println!("{:?}", [0..x]);    
}

// [0,1,2,3]
```

This should remind C# users of `Convert.ToInt32("3")` which is of type `string -> int`. However, we only have `parse()` here, which somehow decides `x` is an integer; for all we know, `"3".parse()` can also produce a float number. But how? 

By constraints! Rust is very eager to please, and it tries hard to make our code work, IF ONLY we drop it a hint. See, `[0..x]` would ONLY work if `x` is an integer, although it appears after `parse`, Rust was able to infer this constraint and "unify" the code, just to put a smile on the poor programmer's face.

Choice is usually good but in this case, "only" is better than none or many - as there can ONLY be one implementation for "parse()" to work on `int` as return type; in another word, there must be a unique implementation for each combination of INPUT and OUTPUT types.

This is where the big differentiator is: other language may support operator overloading but return type never comes into the equation.

In Rust this can be made explicit with the "turbofish" operator, so we can write `"3".parse::<i32>()` or `"3".parse::<f32>()`. Now it should be clear that purity is not broken - it just appears so when the type parameter is left out, where in a fact it's really essential!

Of course, it becomes clearer if we drill down to implementation level; By the types of operands and result, Haskell will choose only one implementation when `+`/`op` is applied, and the chosen implementation is pure in plain sight.

For me personally this is a mind shift: "has-a" does not cut it. `a` does not own both relationships `a + a = [a]` and `a + a = Bool`, instead the operands and result are all **part of** a UNIQUE relationship; it's "collaborative".

# Dependency Injection?

Looking at the Haskell example again, notice how `+`/`op` is quite open: new implementation with unique combination of types can be added at almost any time; and the compiler is able to pick up the implementation to "unify" on use site and make our code work. This will remind us of the ~~in~~famous dependency injectors as in C# or Java: a container will keep all the binding of interfaces to respective implementations, typically at runtime (although it's becoming a thing to do that at compile time); here the Haskell compiler does the job of keeping tabs of what implementation to pick for what types. This is why some people would jokingly refer to such features as Dependency Injection.

By comparison in C# overloading `+` for `DateTiem + Span` has to be done in the `DateTime` class (although it's a static method). I would be out of luck if I want to show off `DateTime + Age` unless I am the author of `DateTime`. So it's fair so say this kind of overloading is less open, or closed.

# Sameness

If we peel back the magic, and lay out all the elements - types and values alike - that contribute to the choice of implementation, then it does not look that fancy; they look quite similar across languages.

```
add : T1        -> T2       -> T3       -> (a: T1)          -> (b: T2)      -> T3
add : DateTime  -> int      -> DateTime -> (date: DateTime) -> (days: int)  -> DateTime     // C#
add : DateTime  -> TimeSpan -> DateTime -> (a: DateTime)    -> (b: TimeSpan)-> DateTime     // C#
add : Foo       -> Bar      -> FooBar   -> (a: Foo)         -> (b: Bar)     -> FooBar       // Rust
add : String    -> String   -> Bool     -> (a: String)      -> (b: String)  -> Bool         // Haskell
add : String    -> String   -> [String] -> (a: String)      -> (b: String)  -> [String]     // Haskell
```

Ready for a big reveal? If we leave out the return types, each type signature is unique and adequate to identify a unique implementation. This is no more than method overloading by varying parameter types, as [it's routine in C#](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/member-overloading). 

Let's not stop here. This trick also applies to subtyping. See how `feed` becomes uniquely determinable if we add the type of implementation into the type signature. (Note the tautology here: a signature should be unique.)

```C#
feed : T1   -> Food -> void
feed : Tiger-> Food -> void
feed : Cow  -> Food -> Void
```

It's easy to get carried away here and try to use the same technique on generics, but "parametric polymorphism" does not quite work that way. It's for real: `filter : (a -> bool) -> [a] -> [a]` genuinely does not care what type `a` is, and it needs only one implementation for any type of `a`; therefore, no trick is necessary for the compiler's FOMO.

# More thoughts

As if operator overloading is not deceitfully mind-bending enough, Rust and Haskell take it to the next level with fully-on function overloading. But now we should see, technically it's a matter of keeping tab of unique combinations of types to help identify unique implementations; this should be possible for any statically typed languages - if they ever care to go that far.

Have you heard of that saying? Sources unknown: (of any programming topics) it's either a compiler or a database. In this case, it's a ... database. Right? Right?