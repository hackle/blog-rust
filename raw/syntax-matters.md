Many people ask me, "I *really* want to give functional programming a go, but where should I start?"

Some of them might be expecting, "learn with your favourite language, it's great and it's already functional enough!", so my recommendation is not always what's expected: pick a **proper** functional language.

Yes, you heard me, if you are serious about it, please be advised against learning functional programming from an imperative language, for example, Java, Kotlin, Swift, C#, Python, JavaScript (not even TypeScript); actually, I do not recommend learning with Rust, LISP or Clojure - they are great, just not for this purpose.

These are the languages that I recommend for any beginners: Haskell, F#, OCaml, Standard ML.

You see, despite the well-balanced views of all the nice, encouraging and maybe also politically-correct people, what needs to be said is this: **syntax matters!** A function-first syntax makes a world of difference to help us building an intuitive, simple and strong understanding.

Make no mistake, it's entirely possible to eventually reach the same understanding from ANY language, but it's *so much easier* when the syntax is designed from the get-go for programming functionally.

Exactly how much easier? Let's go through a few examples.

## Composition: not

It's a fact that many mainstream languages already have functional features. My favourite example is LINQ in C#. 

Suppose we have a function `Fn.IsEven`.

```CSharp
public class Fn {
  public static bool IsEven(int num) {
    return num % 2 == 0;
  }
}

var evens = new [] { 1, 2, 3, 4, 5 }.Where(Fn.IsEven);
// { 2, 4 }
```

LINQ is sweet enough to allow the method-group, or "point-free" syntax. What if I want to filter odd numbers using `IsEven`, but without defining `IsOdd` from scratch? The most straightforward solution is,

```CSharp
var odds = new [] { 1, 2, 3, 4, 5 }.Where(n => !Fn.IsEven(n));
```

But really all we need is this to restore the method-group style.

```CSharp
public static Func<T, bool> Negate<T>(Func<T, bool> fn) {
    return n => !fn(n);
}

var odds = new [] { 1, 2, 3, 4, 5 }.Where(Fn.Negate<int>(Fn.IsEven));
```

Be assured I am not showing off any C# skills, with appreciation that this can be quite a mind-bender for most C# programmers. 

Now let's see how it looks like in Haskell.

```haskell
> filter even [1,2,3,4,5]
[2,4]

> filter (not . even) [1,2,3,4,5]
[1,3,5]
```

While the C# example can be mind-bending, please note, this is nothing advanced in `Haskell`. It's very basic, if not boring code.

## Composition: .

Let's look closer at `.` in `(not . even)`.

The choice of operator usually reveals the aesthetics and value preferences of a language. In OO languages, `.` is reserved for accessing fields of objects, in Haskell, `.` is reserved for composing functions. Its definition is,

```haskell
:t (.)
(.) :: (b -> c) -> (a -> b) -> a -> c
```

(For reference, `not . even` is called backward composition, in contrast to forward composition `even -. not`. In F# it's made even more intuitive `not << even` and `even >> not`.)

Let's take a detour. A `Python` programmer is entitled to feelings of accomplishment after grokking its famous decorators - a powerful tool.

```Python
def negate(fn):
  def decorator(*args, **kwargs):
    return not fn(*args, **kwargs)

  return decorator

@negate
def is_even(n):
  return n % 2 == 0

print(is_even(3))
print(is_even(4))
```

The variadic (taking multiple parameters) feature is nice, but the keen reader would have recognised this "advanced" decorator is simply a variation of the `Fn.Negate` function defined above. `Python` support of top-level functions shows faith, which if offset largely by its horrendous lambdas syntax (only challenged by Go).

```Python
def negate_fn(fn):
  return lambda *args, **kwargs: not fn(*args, **kwargs)

print(negate_fn(is_even)(3))
print(negate_fn(is_even)(4))
```

Despite the hype around decorators, `negate_fn` is much preferable. For one, `@negate` over `is_even` is confusing because it changes the meaning of `is_even`, as it's the case for many decorators out in the wild.

Returning to Haskell, there is no mentioning of "decorator", as such composition is trivially expressed with `.`.

```Haskell
> is_odd = not . even
> is_odd 3
True
```

Of course, the above decorator is a special case of function composition, as it acts on the return value without changing its type (`boolean`).

## Composition: design patterns

Since we are at it, let's look at decorator, adapter, proxy, bridge and wrappers together - some of the popular design patterns in the Object-Oriented world.

Why together? Because they are essentially the same idea of composing functions, if one accepts that a (non-data) class is not much more than a "bag" of methods, and an interface a "bag" of function types.

```Haskell
(.) :: (b -> c) -> (a -> b) -> a -> c

-- decorator acting on the return value
decorator1 :: (b -> b) -> (a -> b) -> a -> b

-- decorator acting on the input value
decorator2 :: (a -> b) -> (a -> a) -> a -> b

...adapters, bridge, proxy
```

In fact, if we dig a bit deeper, any design patterns can be expressed trivially with function composition.

It may be hard to believe for some readers, but I am not showing off - this realisation is hardly any secret, it's something that should come naturally to a Haskell programmer. It's so trivial, a self-respecting Haskell programmer wouldn't even think about it, let alone writing a length blog post.

Some readers may question whether "function composition" is a different idea than in "composition over inheritance", whereas the word means building a bigger class from smaller classes. Now think of a class as a bag of methods, then composing classes is essentially composing functions.

## Currying and interfaces

While most people use 1:1 mapped interfaces and classes for silly things like IoC containers, the true OO programmers go to great lengths to massage different implementations into the same interface. An advanced example is the strategy pattern.

```CSharp
interface IDiscountStrategy { 
  decimal CalcPrice(decimal original); 
}

record BirthdayDiscount(int age) : IDiscountStrategy {
  public decimal CalcPrice(decimal original) {
    // calculate price based on age etc.
  }
}

record MemberDiscount(string cardNo, string code) : IDiscountStrategy {
  public decimal CalcPrice(decimal original) {
    // calculate price based on member type
  }
}

// to choose a strategy
IDiscountStrategy strategy = isBirthday ? new BirthdayDiscount(20) : new MemberDiscount("0123-4567", "888");

var finalPrice = strategy.CalcPrice(100);
```

This is advanced OO because it's non-trivial usage of language features. Now let's try to express the same algorithm in Haskell syntax.

```Haskell
-- implementation left out

birthdayDiscount    :: Int ->               Decimal -> Decimal
memberDiscount      :: String -> String ->  Decimal -> Decimal

isBirthday = True

calcPrice cardNo code age original = 
    let strategy = if isBirthday 
                    then birthdayDiscount age 
                    else memberDiscount cardNo code 
    in strategy original 
```

Suspicious of how I used the layout to bring out the common parts of `Decimal -> Decimal`? Well you should be, because this is the essence of interfaces. Quite trivially the commonality is unified into `strategy`, the result of *currying* on one of the two "strategies", `birthdayDiscount` and `memberDiscount`.

But where is the *interface*?! Well, who needs it?

## Single Method Interface

For those who insist that interfaces and functions are completely different species: Java spills the beans long ago. a lambda is modelled as a Single Abstract Method (SAM) interface, this is carried over to Kotlin, see [*functional interface*](https://kotlinlang.org/docs/fun-interfaces.html).

In Python, an interface ("Protocol") can be defined for a function type ("Callable"). The cross-over is everywhere when we know where to look.

## In Stark Contrast

Some people believe the simple and intuitive syntax (of the likes of Haskell) is "just nice", and won't account to much when it comes to more complex programs. They believe when complexity piles up, code in any any language gets messy all the same.

While this may be true in eventuality, it is lacking nuance: code built up with clarity and simplicity will stand bit-rot many times better.

For the final example, consider this small program.

```JSON
current: { "key1": { "a": 1, "b": 2, "c": 3 }, "key2": { "a": 3, "b": 2 } }

insert: "key1" { "a": 2, "b": 1, "d": 5 }

result: { "key1": { "a": 2, "b": 2, "c": 3, "d": 5 }, "key2": { "a": 3, "b": 2 } }
```

Given a map of map (or `Dictionary<string, Dictionary<char, int>>`),

1. insert a new value (a map itself) by `key`
2. if the key already exists, merge the existing value (a map itself) with the new value,
3. when merging the old + new values (maps), if there is conflicting keys, take the max value

Now think a minute how this can be done in your favourite language, then look at how it's done in Haskell.

```haskell
current = fromList [("key1", fromList [("a", 1), ("b", 2), ("c", 3)]), ("key2", fromList [("a", 3), ("b", 2)])]
newValue = fromList [("a", 2), ("b", 1), ("d", 5)]

insertWith (unionWith max) "key1" newValue current
-- fromList [("key1",fromList [("a",2),("b",2),("c",3),("d",5)]),("key2",fromList [("a",3),("b",2)])]
```

Note this is not show-off Haskell (which kind I am not capable of writing), it is idiomatic and natural, following the conventions shaped by the syntax of a well-researched and well-designed language.

## Tools? Yes Tools 

Every time, when we debate the pros and cons of different syntaxes, a wise person would appear and tell us nonchalantly, "these are just tools!"

I usually question if such people speak from real-life experiences. Do they know how different one tool can be from another? In my attempts to be handy from time to time, I visit the hardware store regularly, and know very well a professional drill driver can be 5 times as expensive than a DIY piece. "Just tools"? I don't think so.

Finally, let me leave you the invaluable words from the great Edsger Dijkstra [on Haskell and Java](https://chrisdone.com/posts/dijkstra-haskell-java/)

> It is not only the violin that shapes the violinist, we are all shaped by the tools we train ourselves to use, and in this respect programming languages have a devious influence: they shape our thinking habits. 