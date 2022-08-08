Just because most OO languages are going cross-paradigm, doesn't mean classes and functions always mix up well. In effect, more confusion is in store, and closer care is required.

For starter, what's the type signature of `Intro()` in the following example?

```CSharp
class Person 
{
  public string Name;
  public string Hometown;

  public string Intro()
  {
    return $"{this.Name} from {this.Hometown}";
  }
}
```

## the 0th argument

It's a good habit to pay attention to the type signature to "guess" what a method does, in this case, you may see this with your mind's eye,

```
Intro : () -> string

// I don't use the following form because it's not nearly as easy to understand
string Intro()
```

But that's actually incomplete. The problem is we look at it as a "method" on `Person`. If we change our view slightly, `Intro` can be considered a function, and its complete signature is,

```
Intro : (this: Person) -> () -> string
```

This is actually laid out in plain sight when `Intro` is called,

```
var intro = person.Intro();

// do things with intro
```

In other others, an object is always the first, or `0th` argument to its method, and it is referred to as `this`. 

This (pun intended) is no big secret. Erik Meijer pointed out "there is no `this`!" in [this famous talk](https://www.youtube.com/watch?v=JMP6gI5mLHc), and I am quite sure that Bjarne Stroustrup said something along the same lines - although I can't seem to find any evidence.

This could not have been made more obvious with the extension method syntax.

```CSharp
static class PersonExtension
{
  public static string IntroEx(this Person @this)
  {
    return $"{@this.Name} from {@this.Hometown}";
  }
}
```

## Mutation results in a changed argument

Consider this using the same `Person` class,

```CSharp
var person = new Person { Name = "Hacks", Hometown = "Mashan" };
Console.WriteLine($"{person.Intro()}");

person.Name = "George";
Console.WriteLine($"{person.Intro()}");

// output
// Hacks from Mashan
// George from Mashan
```

This should not be a surprise (not even feigned). As users of the `person` object, we should fully expect mutation to its field to have subsequent effect in the result of its method `Intro`. This is how objects are supposed to behave, if not the whole purpose of using classes and objects.

Why so? Exactly because the full type  `Intro: (this: Person) -> () -> string` clearly states whenever the result string depends on `this: Person`. If `Person` changes (either in place or not is immaterial), the result possibly will too. 

The full type signature helps us see this cause and effect fully.

## Function

That above is essential OO, it works well, but not very sexy. So we will throw in a function.

```
class Person 
{
  // ... all previous code

  public Func<string, string> Greet()
  {
    var intro = this.Intro();
    return (string greeting) => $"{greeting} {this.Intro()}";
  }
}

// to call Greet()
var person = new Person { Name = "Hacks", Hometown = "Mashan" };

var greeter = person.Greet();
Console.WriteLine($"{greeter("Hello")}");

// output
Hello Hacks from Mashan
```

Now we have `var greeter = person.Greet()` that can be called as `greeter("Hello")`. Magic!

What's the full type of the `greeter`? The return type of `Greet()` makes it clear: `Func<string, string>`. Or `greeter: string -> string`.

Surprisingly, a change to person can still have effect on `greeter`.

```CSharp
var greeter = person.Greet();
Console.WriteLine($"{greeter("Hello")}");

person.Name = "George";
Console.WriteLine($"{greeter("Hello")}");

// output
Hello Hacks from Mashan
Hello George from Mashan
```

Would you be surprised? I would be, and it's no pretend, because the type of `greeter: string -> string` does not tell (or warn) me about this relation between `person.Name` and its result. I much prefer the previous form `Intro: (this: Person) -> () -> string` when the dependency on `Person` is in the open!

## A "fix"

The sharp-eyed reader would have spotted a simple fix.

```CSharp
public Func<string, string> Greet()
{
    var intro = this.Intro();   // memoize!
    return (string greeting) => $"{greeting} {intro}";
}

var greeter = person.Greet();
Console.WriteLine($"{greeter("Hello")}");

person.Name = "George"; // with no effect
Console.WriteLine($"{greeter("Hello")}");

// output
Hello Hacks from Mashan
Hello Hacks from Mashan
```

A very nifty "fix" indeed, but I would argue we would be much better served without using `Func<string, string>`, exactly how is an exercise left to the dear reader.

The point is, when functions are mixed up with classes, there seems to be a new layer of complication. This is no hearsay! Because with function comes closure, and not everyone is ready to deal with closures.

## A class is a closure

The rumours had it, classes were invented because programmers were not trusted to deal with closures.

How so? Well, A class limits the level of closure to one. It's simple,

* a closure is introduced when a class instance is constructed, with its fields and methods the only things in this closure.
* with OOP, it's well understood that when any field in the closure changes, the methods and other fields will possibly change too.

This is manageable because typically there is ever one closure to manage at a time. (I say typically because there are the rare cases of nested classes).

Not when functions come into the picture! When functions reference variables outside of its body, it entangles with its closure (via references, if not also memoisation). Now the nice understanding of objects, states and change propagation is also lost. Consider again,

```CSharp
person.Name = "George"; // with no effect
Console.WriteLine($"{greeter("Hello")}");
```

Should change to `Name` have any effect on `greeter("Hello")`? There is really not way to know except reaching into the definition of `greeter`; this cannot be done by looking at  `Func<T, U>`; we must trace back to the `Greet` method. What bother!

## It's worse with just functions!

Just a brief detour - this problem can actually be pretty bad with just functions alone.

If you think this is a useless, contrived example and only applies to obtuse use of `C#` language features, consider this React code partly copied from [the React reference](https://reactjs.org/docs/hooks-reference.html#usecallback).

```JavaScript
function BusyComponent() {

    const memoizedCallback = useCallback(
        () => {
            doSomething(a, b);
        },
        [a, b],
    );
    
    // ...
    <button onClick={memoizedCallback}>Foo</button>
}
```

With React hooks, Components are no longer classes, they are all functions. Hurrah..?

In this case, when used in a busy React Component, it's best to `useCallback` to memorise a call-back function, in this case `doSomething`, to avoid creating a new function reference every time the component is rendered (or, the function executed); EXCEPT when any of `a, b` changes - because `doSomething` depends on variable `a, b`.

The problem is, if `[a, b]` is incorrectly specified, `memoizedCallback` will go out of sync, resulting in some of the most subtle, most confusing bugs. Hence the recommendation to use eslint plugin `exhaustive-deps`.

While this may be attributed to the difficulty of "cache invalidation", it's also due to the bane of existence for programming with functions: closures. `memoizedCallback` uses variables `a, b` from the closure, therefore is entangled with it.

## Closures are messy

To make sense of such entanglement, it's tempting to include the closure in the types,

```
memoizedCallback : closure -> () -> void
```

But this does not really help THAT much, because closure is open-ended, or basically untyped; it can also belong in another closure, because nested functions are no stranger to the scene - we love functions!

This is more expressibly typed as would some Haskell programmers,

```
memoizedCallback: Universe -> () -> void
```

A bit hyperbolic, but you get the idea!

## How do THEY manage it?

It could sound all doom-and-gloom, but I am not advising against use of functions. "Functional" programmers have been managing it for ages, what's their secret? The answer is so simple it might be disappointing: **STICK TO IMMUTABILITY** if you want to use functions. The moment you start sticking to immutability, all the monsters go "puff"!

* if `Person.Name` never changes, the `greeter` will also return the same result for the same input.
* if `[a, b]` never changes, `doSomething` will always be the same reference.

This applies no matter how many layers of closures there are. 

(Ok to be fair it is a bit doom-and-gloom for React, as hooks are not changing any time soon, and they seem to be turning people away.)

It's that simple. You see, immutability has vast and far-reaching effect to how programs work, and how we think and write code. This is just a small tip of the iceberg.

## In closing

I used C# for the code example for its perseverance in being an object-oriented language, by comparison with Python or Kotlin, it hasn't quite the mixed bag of OOP and FP features; in Python or Kotlin, closure hell looms more dangerously.

A word of advise for keeping sanity: if you use classes, watch out for functions as they can introduce closure hell; If you use functions and closures, stick with immutability.

People may contend that being "purely" object-oriented is restrictive, but pure OO is trying to save us by keeping us away from a pretty ugly monster: closure.

But of course we never really listened because the temptation of functional programming was just too much - not just the programmers, but the language designers are also to blame.

So quite unstoppably, the paradigms are coming together: OO reached its ceiling, and to keep the languages relevant, people must borrow fresh ideas that used to be exclusive in the "functional" paradigm. It's the best times for the constant excitement, it's also the worst time for the inevitable confusion.

It's possibly too late to recommend sticking with classes and avoid using functions completely; but it's never too late to recommend immutability as the default for your code.

And hear this: if you stick with immutability, then you will have less and less need for classes. For many, this could be stating the obvious, so I will leave it as a fun exercise to the reader.