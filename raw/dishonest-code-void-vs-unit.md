If there is a time to say "be careful with what you wish for", it's when C# programmers are calling for the `unit` type to replace `void`.

## 0 != 1, or does it?

Kotlin has the unit type and C# does not, so let's draw a comparison.

```Kotlin
fun giveOneThing(): Unit {
  return Unit
}
```

```CSharp
// C#
void GiveNothing() {
}
```

These two functions are equally meaningless - nothing really happens in either implementation. That's because I was trying to be loyal to the types without laying on extraneous stuff. Minimalism is a virtue. 

The first difference is `giveOneThing` returns a `unit`, and `GiveNothing` returns `void`. The former is a type with one value: `unit`, whereas `void` has no value. What a cool name!

(Mind you it's not really `return void`, but simply `return`, as `void` does not have value - C# is more consistent than Java who allows `return null` for `void`. It's a big deal!)

The difference may sound pretty fundamental, philosophically: isn't this like `1` and `0`, or **have** and **have-not**? Well, that may be in philosophy, but in programming, when considering the significance of types, we just count their values and see what choices that leaves us.

Once we look at it that way, then the difference is quite small: the choice from 0 value vs the choice from 1 value? Not much to me!

That's why people say "`unit` and `void` are essentially the same thing".

As an anecdote `unit` is also called "0-tuple" and is alternatively represented as `()`. Exactly how does a 0-tuple have ONE element? And how on earth a 0-tuple is different from an empty type `void`? Shouldn't they be the same? I know right... but that's something that I would rather not get into now. 

## Assignable, composable

The big fuss with using `unit` to replace `void` is how `void` is not **composable**. "Composability" or "compositionality" (I have no idea what the differences are) is big these days, even bigger than "composition over inheritance".

This usually involves generics. Not the [Fake Generics](/fake-generics-the-anti-pattern), but the real deal:

```CSharp
Func<T, V> Compose<T, U, V>(Func<T, U> t2u, Func<U, V> u2v)
{
    return Func<T, V>(t => u2v(t2u(t)));
}
```

You see, `Compose` is **truly generic** and works for any types of `T, U, V`... well not quite. Because `void` is the exception!

```CSharp
var fnStrLenIsEven = Compose(str => str.Length, len => len % 2 == 0);
var helloLenIsEven = fnStrLenIsEven("Hello"); // false
var woorldLenIsEven = fnStrLenIsEven("Woorld"); // true

void Log(string msg) { ... }    // note the return type: void

// but this won't work
var fnCheckBookExistsThenLog = Compose(
    bookId => db.GetBook(bookId), 
    book => Log(book == null ? $"Book not found" : $"Book is {book.Name}")
);

// fnCheckBookExistsThenLog: Func<BookId, void>
fnCheckBookExistsThenLog("ISBN-123");   // no good
```

This is not ideal. It drives people to madness like this,

```CSharp
// fnCheckBookExistsThenLog: Func<BookId, bool>
var fnCheckBookExistsThenLog = Compose(
    bookId => db.GetBook(bookId), 
    book => { Log(book == null ? $"Book not found" : $"Book is {book.Name}"); return true; }
);
```

Wouldn't it be sweet if we had `unit`, then `fnCheckBookExistsThenLog` can be `Func<BookId, unit>`! Then there is no need for the ugly workaround. In fact, there is no need for the ever ugly `Action<T>`, and we can freely compose `Func<T, Unit>` with `Func<Unit, V>`!

Well... maybe not so fast. The question we need to ask ourselves is: why is `void` not composable? And should it be composable?

## honesty, the rare quality

A quality much under-appreciated for code (if not also for people), is honesty. Code, functions, methods, classes, modules, APIs and services, if each and every one of them are upfront and clear about what it does (maybe also stay true to that), then the places for us programmers would be enviable ones indeed.

As is with being a honest person, keeping code honest is much harder than it sounds - it may be easy to keep to it once in a while, but its VERY HARD to do so consistently. 

The problem is, the world is a very harsh place: if a person is found to be dishonest for one thing, then everything else comes into question. The same applies to code: dishonesty erodes the benefits of honesty very quickly.

This analogy works well with static types. An **honest** method does exactly what it says, leaving no surprises to the callers. Consider `LengthIsEven` below,

```CSharp
bool LengthIsEven(string str)
{
    return str.Length % 2 == 0;
}
```

`LengthIsEven` is honest. It says exactly what it does, and does exactly what it says. No less, no more. But consider `LengthIsOdd` (pun intended).

```CSharp
bool LengthIsOdd(string str)
{
    MineBitCoin();
    return str.Length % 2 == 1;
}
```

This is dishonest, crooked, fraudulent, and despicable! 

But let's say `MineBitCoin` is intended behaviour, how would you make `LengthIsOdd` honest? Maybe resort to naming, the ultimate solution? Tada! `bool LengthIsOddAndMineBitCoin(string str)`?

Possibly not! Naming gurus will point out, a long name screams for separation, but separation of what? Of side-effects!

This is something we really should talk A LOT MORE about (instead of wasting time bickering about vague contraptions like SOLID or design patterns): 

**Side-effects should NOT mix up with decision making.**

Don't let the imperatives scare you. This is actually very easy to follow, for the above example, we simple do,

```CSharp
MineBitCoin();      // <-- moved out of LengthIsOdd

var helloIsOdd = LengthIsOdd("Hello");      // no side-effect at all
```

Heh, this is pretty honest! Whether `MineBitCoin` is acceptable or not, that's a question for the bosses; but the code lays it out in plain sight. 

And now we reach the point of realisation: 

* `void` is used for side-effect (or else it's useless)
* side-effects should be made explicit and kept separate from decision making

Simple as that. But simplicity should not breed contempt. Let's circle back and see what `unit` leads to.

## Fake composition

People say `unit` lends better to composition, but they leave out something important from such assertions: composition OF WHAT?

The implementation of a function returning `unit` is usually not `return unit`, but much like `void`, it's possibly full of side-effects: interacting with file system, databases, external services, launching a missile, *the whole universe*.

But what's the problem with composing side effects? Suppose we have `unit`.

```CSharp
Unit WriteToConsole(string prompt);    // yes, Unit!
string ReadFromConsole();

var promptAndRead = Compose(prompt => WriteToConsole(prompt), unit => ReadFromConsole());
var name = promptAndRead("Please enter your name: ");
```

From the first look, `promptAndRead` is sweet; but what is the type? It is `Func<string, string>`.

And what does this type tell us? A `string` goes in, and a `string` comes out. Looking at the type alone, one would guess it's possibly a function that reinventing the input string, like `String.Reverse()`?

We cannot fault people for guessing that, because without knowing the name `promptAndRead`, there is no telling from the type. In other words, `promptAndRead` runs the risk of being dishonest.

More generally, by composing `Func<T, Unit>` with `Func<Unit, U>` to get `Func<T, U>`, the side effects go in hiding!

Naming is vital, but it can only go that far.

## void is unyielding

Now we are ready to see `void` in a new light: all the quirks aside, it's very **honest**. A method returning `void` loudly and clearly communicates to any caller: 

**"Watch out! I have side-effects!"**

What about its rather inconvenient non-composability?

```CSharp
void WriteToConsole(string prompt);    // yes, void!
string ReadFromConsole();

var promptAndRead = Compose(prompt => WriteToConsole(prompt), () => ReadFromConsole());   // no way!!!
```

As a type with no values of its own, `void` refuses to mix up with types with values. It is disciplined, it is austere, and it's unyielding.

This is in contrast to `unit`, who is also an indication of side-effect, but it's less disciplined, more social, and mixes freely with other types.

Their "social lives" are not just their problems, but very much ours: for its free life-style, `unit` lends itself well to hiding side-effects from plain sight, whereas `void` takes a stronger stance and demand us to re-consider, or it forces us to use ugly workarounds.

## Linq ForEach

There is no greater example than `ForEach`, the famously missing function in `LINQ`.

Many C# programmers ask this question: how come there is `List<T>.ForEach(Action<T>)`, but not `IEnumerable<T>.ForEach(Action<T>)`?

The easy answer is, while `List` champions side-effects (consider `Add`, `Append`, etc), LINQ is made with immutability and laziness in mind, and all "native" LINQ functions are free of side-effects.

Of course one can still mix up LINQ with side-effects by the power of free will, more often than not, to surprising effects.

```CSharp
var head = Enumerable.Range(1, 100)
    .Select(n => { Console.WriteLine($"Current number is {n}"); return n; })
    .FirstOrDefault();

// run this, and only one line is printed:
// > Current number is 1
```

This is laziness at its best - `Select + FirstOrDefault` warrants the optimisation of only evaluating the lambda in `Select` for the first element of the `Enumerable`. However, this does not hold if the caller is expecting `Select` over side-effects for each element! Worse yet, the side-effect is disguised as `Func<int, int>`!

That's exactly where `ForEach(Action<T>)` wouldn't fit it: it MUST have side-effect as `Action` returns `void`. If `ForEach` had been built-in, it wouldn't make much sense along side `Select`, `Where` or `FirstOrDefault`, or LINQ would self-defeat and self-destruct.

## In closing

At least for C# and LINQ, the idea of NOT mixing up side-effects with "pure" code is deeply rooted in the design (at least for a good period of time).

The popular cry for using `unit` over `void` is yet another case of preferring convenience over correctness. `void` is a very respectable existence and C# does it justice by not allowing any value to be created for it, and not allowing it to be composed with other types.

On the other hand, `unit` is a half-hearted attempt at signalling side-effects, but such signals are easily compromised by its lack of discipline.

Respect `void`! At least it tries to keep us honest.