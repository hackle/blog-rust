"Generics", what does it mean?

You would laugh at me - what a stupid question! 

Maybe so, but maybe not. In fact, for a few times over the last few years, I ran into disagreements on the meaning of the word "generic" in term of programming: the other programmers respectively contend that being "generic" means using reflection to carry out operations on a piece of data with otherwise anonymous type. This is even taken to service- or architectural height, where a service seem to state it's able to handle ANY input, but in fact keeping an internal register of permitted types.

This is a shame, because generics are supposed to give strong guarantees and strong intuitions. To show what I mean, let me run a few comparisons between C# and Haskell - a major source of useful intuitions for me.

As usual, it starts with something so simple it's almost trivial, such as `id` (short for "identity").

```haskell
id a = a
```

Or in a language like C#, indulge me for the idiomatic naming,

```CSharp
class IDProvider
{
    public static T ID<T>(T a)
    {
        return a;
    }
}
```

Laughably simple. A Haskell learner will be quick to point out, for a function of type `a -> a`, `id` is the only implementation (or, any meaningful implementation will converge with `id`), because being polymorphic, `a` reveals no details or operations available on the concrete object at the time of calling `id`, so it's incorrect to make any assumptions (not even `.toString()` as unified type systems provide, which has its own correctness issues), and the only correct thing to do is to return whatever argument as it is.

Surprisingly, it can be insurmountably difficult to get this intuition - for me at least at the time - because I was so entrenched in "real-world" programming, and couldn't help thinking what I could do to a generic type: 

1. using reflection to reveal the runtime object's type, say `int`, 
2. cast to that type `int`
3. invoke any operation on `int`, e.g. `a + 1`
4. cast back to the generic type

In C# with its patent type narrowing,

```CSharp
class IDProvider
{
    public static T ID<T>(T a)
    {
        if (a is int b)
        {
            return (T)(object)(b + 1);
        }

        return a;
    }
}
```

This is "advanced" programming for a mainstream programmer, being celebrated and taken pride in. However the cost of such power is the sabotage of guarantee that should come with strong typing. `ID` is no longer truly "generic" as soon as we wield the surgical scalpel of reflection. The behaviour of `ID` is now unfathomable to its callers.

The surrender to the dark magic of reflection, either for egocentric show-off or the best intentions, turns `ID` from a completely transparent function to an utterly opaque piece of mud.

Following the strong intuition of `id :: a -> a`, we get to `absurd` as `absurd :: Void -> a`. It states that for lack of any information (`Void` is a COMPLETELY empty type with no value, not to be confused with `void` in Java or C#), as the name implies, it's IMPOSSIBLE to construct a value of ANY generic type `a`.

In C# terms, 

```CSharp
class AbsurdFactory
{
    public static T Absurd<T>()
    {
        return ???;
    }
}
```

Again the intuition cannot be obtained, for how easy it is to jail-break from the constraints enforcible by strong typing.

```CSharp
class AbsurdFactory
{
    public static T Absurd<T>()
    {
        if (typeof(T) == typeof(int)) return (T)(object)3;
        
        return default;
    }
}
```

Again one could resort to reflection so `AbsurdFactory.Absurd<int>() == 3`, but `AbsurdFactory.Absurd<long>() == 0`. More conveniently, C# repurposes the `default` to return the "sensible default", with a soft warning "possible null reference return", even when I explicitly enable null safety with `#nullable enable`. 

To put it in glaring daylight, this also receives similar warning.

```CSharp
#nullable enable

// warning: Converting null literal or possible null value to non-nullable type.
string hoy = default;
```

What does that make `AbsurdFactory.Absurd`? We might as well ask, is the glass half empty or half full?

One would be permitted to think this is mumbo-jumbo, but not so. How different is `AbsurdFactory.Absurd` to a typical IoC container? Not very, I am afraid.
