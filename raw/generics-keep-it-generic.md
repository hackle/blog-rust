There is really just one *hard* rule to using generics, and it's also *easy*: just keep it generic!

However this is only *easy* to say, because holding on to this simple discipline is hard, and programmers do not always succeed in resisting the temptation of convenience.

## Identity: count the implementations

This is to test your understanding of generics. How many implementations are there for the `Id` function below?

```CSharp
T Id<T>(T thing)
{
    // how to implement this?
}

// or
id : a -> a
id a = ?
```

If you so much as hesitate for a second, you might want to rethink if you really *get it*.

The answer is - there should be only ONE meaningful (without "cheating") implementation.

Believe me, I am in no position to gloat here: as a C# / Object-Oriented programmer back then, it took me VERY long to figure out exactly why.

These days we may take it for granted in any language (with the exception of Go), but for a long time generics was pretty much an idea for the functional programming crowd. Extraordinary stories were to be told about the introduction of it to the likes of Java or C#; at the same time, it's helpful to understand because of its history, generics does not always fit into the slowly evolving (if not sometimes stagnant) OO thinking, in fact, it can be at odds with it.

## a is forall

No suspensions. The point of epiphany for me was when I learned from Haskell that a more verbose way to express the `id` function above. (Think of `a` as `T` if that suits your better)

```Haskell
id :: forall a. a -> a
```

`forall a.` really says everything there is about generics: any meaningful implementation of `id` must apply to ANY possible type `a`. 

Now take a minute to think about it: this is a tall order! It's like asking a chef to cook a dish that everyone on earth will like. Well, that's actually quite impossible, but you get the idea: the dish must be very, very *generic*.

For the `id` function, it really cannot be too particular, and it best not make ANY assumptions about its input: is it an `Int`? A `String`? A complex class or struct? No! That's not the way to go about it. It must obey the only rule: keep it **generic**!

Now you see, `id` cannot assume knowledge, or pry into the type of its parameter; That really leaves it not many options; actually, there is only ONE sensible implementation: 

```CSharp
T Id<T>(T thing)
{
    return thing;
}

// Haskell

id : a -> a
id thing = thing
```

That's it! That's the most important thing to know about generics.

No way! You say, this can't be! Generics is way cooler than this dumb stuff. Where goes the magic? Oh we shall see, there should be no magic; actually, most magic out there are tricks to cheat generics, and are frowned upon. 

## Cheat

Back at the time, as a C# programmer I couldn't accept the "generic" nature of *generics* (hello!), and really tried to prove otherwise. For example, what if I do this?

```CSharp
T Id<T>(T thing)
{
    throw new Exception("Busted");
}
```

Later I learned, this is considered "cheating" with code, because this function does not really return `T`, as the type says. Throwing an exception can actually crush the entire application - it's like GOTO, and it's mostly dynamic typing (of exceptions) in disguise.

When **reasoning** with generics (or anything for that matter), it's very helpful to leave side-effects out of the equation; otherwise, there is no end to surprises. For example,

```CSharp
T Id<T>(T thing)
{
    SpendLifeSavingOnLottery();
    return thing;
}
```

This satisfies `forall a. a -> a`, but it's not very pleasant: the first time it's called, the poor user's life saving is spent; the second time, it possibly throws a scary exception "account is overdrawn". Side-effects really throws in a monkey's wrench, and stops us from reasoning about the behaviour of `Id` in a sensible way.

## Peeping, a violation

It was previously mentioned that generics can be at odds with traditional OO concepts. For one: generics is also called *Parameteric Polymorphism*, whereas OO champions another form of polymorphism in sub-typing, you know, inheritance and all.

These two types of polymorphism are not exactly mutually exclusive, but together they can make things quite awkward some times. For example, how come a value of type `List<Teacher>` cannot be assigned to a value of `List<Person>`, but `IEnumerable<Teacher>` can to `IEnumerable<Person>`?

```CSharp
var teachers = new List<Teacher>();
// Cannot implicitly convert type 'System.Collections.Generic.List<Teacher>' to 'System.Collections.Generic.List<Person>'
List<Person> people = teachers;

IEnumerable<Teacher> teachers = new List<Teacher>();
IEnumerable<Person> people = teachers;
```

Enough with [variance](/contravariant) but let's look at how we can cheat with generics: reflection! The source of many evils.


```CSharp
static T Id<T>(T thing)
{
    if (thing.GetType() == typeof(int))
    {
        return (T)(object)((int)((object)thing) + 1);
    }

    return thing;
}
```

This peeps inside `T` and assumes knowledge about `thing`, and throws in some magic. How clever! But... do you see the problem?

This magic version of `Id` will surprise any unsuspecting callers, who wouldn't be expecting the special treatment to `int`. 

You see, while language designers are eager to please and give us *powerful* features to use, unfortunately though, more often than not, at the cost of our fellow engineers confusion.

For a less contrived example, you would have seen people gloating about examples of pattern matching on types, sometimes, even on generics!

```CSharp
static string PersonInfo<T>(T psn)
{
  switch (psn) 
  {
    case Student st: return $"{st.Name} is a student";
    case Teacher tch: return $"{tch.Name} is a teacher";
    default: throw new UnimplementedException($"Cannot handle {psn.GetType()} yet");
  }
}
```

This is by far the worst use of generic, because it completely undermines the promise of being GENERIC - hello! A bag of special cases hidden under the beautiful promise of `T`. Please don't write anything like this.

(Note `PersonInfo` would be better typed as `string PersonInfo(Person psn)` to minimise confusion; however it would still be a bad design as [it opens up what's meant to be closed](/dont-close-what-is-open))

## Nullable

The evil can catch us off-guard. For example, this magic `Map`.

```CSharp
public static U Map<T, U>(T input) where U : new()
{
    if (input == null) return new U();

    // maps T to U
}
```

You would have heard of the "million dollar mistake" by sir Tony Hoare, and `Map` is a noble attempt at nibbing that from (not exactly) the bud.

This is completely valid syntax-wise and may even seem quite reasonable and helpful by many; the author is considerate enough to use type constraints to inform the caller that `U` must be constructible without any parameters. However, without knowing the implementation, an experienced programmer would use it as follows,

```CSharp
var person = Map<Teacher, Person>(teacher);
if (person == null) return;

SendFlowers(person);
```

This is great, defensive code. However, thanks to be magic in `Map`, the defensiveness here is rendered useless, and a lot of flowers will be sent to non-existent, nameless `Person`s.

## Dynamic typing

One of the biggest misunderstanding is parametric polymorphism only applies to statically-typed languages, this is underestimation of the worst kind. It's true that generics make it "in the face", but knowing when to apply and stick to "generic for all" should be on our minds, no matter the languages being used.

The most famous counter-example would have to be `promise` in JavaScript. Simply put, 

- To construct a `Promise<T>`, we use `promise.resolve<T>(value: T)`, which should apply to all types (remember, it's `forall. T`)
- if `T` can be ANYTHING, it can also be `Promise<T>`, so to construct `Promise<Promise<T>>`, we can write `promise.resolve(promise.resolve(value: T))`.

This is no mind-bender, it's just one level of nesting. Let's see how it plays out.

```JavaScript
> Promise.resolve("a").then(p => console.log(p));
a   // so far so good

> Promise.resolve(Promise.resolve("a")).then(p => console.log(p))
a   // hold on, what's going on?!
```

Nesting promises is a futile enterprise - they collapse into one single level. The designers may not like the movie "Inception" very much, and are very eager to swat out any attempt at nesting promises. Not just that, what about the code below?

```TypeScript
> Promise.resolve({ foo: "bar" }).then(p => console.log(p.foo));
bar

> Promise.resolve({ foo: () => "bar" }).then(p => console.log(p.foo()));
bar

> Promise.resolve({ then: () => "bar" }).then(p => console.log(p.then()));
Promise {<pending>}     // what's going on?

> Promise.resolve({ then: () => "bar", foo: "bar" }).then(p => console.log(p.foo));
Promise {<pending>}     // p.foo won't work now
```

Within the implementation somewhere, there is a special case to inspect the value to be resolved, if it has a `then` field which is a function, this `then` field is then treated as a `Promise`, and once resolved, trips up code above.

You may think this is a trivial edge case, but I am not ready to accept it as a bug. Using "dynamic" as an excuse is not good enough; sticking to `forall. T` is not that hard! Especially when it's made very clear with ample discussion. This is exactly what design flaw looks like.


## In closing

The power of generics, or parametric polymorphism is also its *downfall* in the eyes of the clever programmer. `foo<T>` works for ANY type it's both powerful and restricting.

With mainstream languages, thanks to the inevitable transition of paradigms, we are given the tools to break out of the rigidity of such strong constraints, and more often than we should, such tools are used for convenience; promises are broken, magic is tucked in, and the confusion begins.

