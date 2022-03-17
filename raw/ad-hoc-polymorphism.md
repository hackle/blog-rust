If `"foo" + "bar" == ["foo", "bar"]`, can it also be `"foo" + "bar" == False`? Yes indeed, if you are using a language like Rust or Haskell. The same expression ``"foo" + "foo"`` can return either a boolean or a list. This is ad-hoc polymorphism at its best (or worst depending on your view) messing with us!
(The example is attached at the end).

# Don't be a stranger

We know out of the main types of polymorphism, subtyping is the most flexible: we can swap out implementations completely as long as the common interface is satisfied, which isn't that hard, especially with classes anything implementation-specific parameters can be shoved into a constructor (a form of currying for the cheat). So we can almost define a common interface for any operation: `do(): void`.

Then there is parametric polymorphism or generics with which we can typically define operations over "structures" instead of specifics of element types, such as `map: (a -> b) -> [a] -> [b]` is generic over list, and does not care what specific types `a` or `b` is, at least when `map` is defined.

Ad-hoc polymorphism is no stranger to us - in any language with more numeric types than `JavaScript`, it's common to use the same operator `+` for addition. In C# for example,

```CSharp
Console.WriteLine((1 + 2).GetType());   // System.Int32
Console.WriteLine((1.5 + 2.5).GetType());   // System.Double
```

We may have been taking it for granted, but `+` is polymorphic over integers and floats. Of course the case is made more clear by `DateTime.Now + new TimeSpan(0, 0, 1)` where it works on `DateTime` and `TimeSpan`. Operator overloading is widely supported across many languages. It's not exclusive for static-typed languages either - Python has it through special functions like `__add__`. The honorary mention goes to Java as one of the exceptions.

# Object Orientation fools us

But this is where object orientation and "has-a" thinking runs deep for me personally. I've always (if somewhat subconsciously) held the belief that such operations must be defined on the "receiver", or the class that holds the method. As in Python, `__add__` is defined as an instance method; in C# is static which makes more sense, but it has to belong in a "class" even in this case it's just a namespace, and never a standalone declaration. For example [this definition](https://github.com/microsoft/referencesource/blob/5697c29004a34d80acdaf5742d7e699022c64ecd/mscorlib/system/datetime.cs#L1485),

```CSharp
struct DateTiem {
    static DateTime operator +(DateTime d, TimeSpan t) { ... }
}
```

Well that sort of thinking is more or less justified - `new TimeSpan(0, 0, 1) + DateTime.Now;` won't work for "error CS0019: Operator '+' cannot be applied to operands of type 'System.TimeSpan' and `System.DateTime'".

# Purity

Languages these days have the consensus of basic type inference, for example to leave out the type of the return value of a function call. After all, the same function can have only one return type, when all inputs are decided, right? Right? (Think the famous meme here). I mean this is how we define "pure function". Does our Haskell example break purity?  

Most certainly not, it's just a matter of perspective. Previously I wrote about a "sighting" of ad-hoc polymorphism in Rust, here is another example.

```Rust
fn main() {
    let x = "3".parse().unwrap();
    println!("{:?}", [0..x]);    
}

// [0,1,2,3]
```

This should remind C# users of `Convert.ToInt32("3")` which is of type `string -> int`. However, we only have `parse()` here, which somehow decides `x` is an integer. How? See, `[0..x]` would ONLY work if `x` is an integer, although it appears after `parse`, Rust was able to infer this constraint and "unify" the code. 

For Rust, "only" is better than none or many in this case - as there can only be one implementation for "parse()" to work on `int` as return type; in another word, there must be unique implementation for each combination of INPUT and RETURN types.

This is where the big differentiator is: other language may support operator overloading but return type never comes into the equation.

In Rust this can be made explicit with the "turbofish" operator, so we can write `"3".parse::<i32>()` or `"3".parse::<f32>()`. Now it's clear purity is not broken - it just appears so when the type parameter is left out, where in a fact it's really essential!

## Dependency Injection?

Let's now look at the implementation of the opening example in `Haskell` (see how the class is called `Strange`?)

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

First, there is the `class` which can be roughly considered an `interface`; then, implementations are made in the form of `instance Strange a [a]`. Remember, the return type comes into the equation (as is defined by the `class`).

Consider how `op` is quite open: new implementation with unique combination of types can be added at almost any time; and the compiler is able to pick up the implementation to "unify" on use site and make our code work. This will remind us of the ~~in~~famous dependency injectors as in C# or Java: a container will keep all the binding of interfaces to respective implementations, typically at runtime (although it's becoming a thing to do that at compile time); here the Haskell compiler does the job of keeping tabs of what implementation to pick for what types. This is why some people would jokingly refer to such features as Dependency Injection.

By comparison in C# overloading `+` for `DateTiem + Span` has to be done in the `DateTime` class (although it's a static method). I would be out of luck if I want to show off `DateTime + Age` unless I am the author of `DateTime`. So it's fair so say this kind of overloading is less open, or closed.

# More thoughts

Think about it, Rust and Haskell certainly take it to the next level, but technically it's a matter of keeping tab of unique combinations of types; this should be possible for any statically typed languages

There is a saying, sources unknown: (of any programming problems) it's either a compiler or a database. In this case, it's a database?