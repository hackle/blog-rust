Postel's law is a simple law about one thing: maximising the potential of a program. But people have managed to make it the most confusing "laws" in software engineering.

Look how many versions there are! [Wikipedia](https://en.wikipedia.org/wiki/Robustness_principle) lists three.

1. "be conservative in what you do, be liberal in what you accept from others" 
    I don't about you but this sounds very religious, or "1984", or some cliche from a mind-controlling authority. 
2. "be conservative in what you send, be liberal in what you accept"
    Great - this is more specific to software. Still, isn't it a bit masochistic? What happens to "Do unto others as you would have them do unto you?"
3. "be contravariant in the input type and covariant in the output type"
    Worthy competition against "monad is just a monoid in the category of endofunctors"?

You would have come across other versions, such as "take the most generic input, give the most specific output", which might not make a hell lot of sense. 

Although confusing, these are all valid interpretations. And I can assure you, Postel's law is a useful law - we just need a much simpler interpretation. And here it is.

## Postel's law, in plain English, for programmers, with regards to Types

Given a function implementation, choose the most generic input type(s), and the most specific return type.

Isn't this much clearer?

Do you see what's been missing from the other explanations? The premise: "Given a function implementation". Without this premise, the law does not make much sense.

## ID, the wrong interpretation

Let's use the simplest example, the `id` function and takes anything and returns it straight-away. 

```CSharp
T id<T>(T v)
{
    return v;
}

// much simpler in Haskell
id :: a -> a
id a = a
```

Now suppose I want to follow Postel's law literally. "Take the most generic input", great! What's the most generic type in C#? It's `object`. So I should write.

```CSharp
T id<T>(object v)
{
    return v;
}
```

And what's the most specific return type? Well, any specific type is quite specific to itself, so I can and should choose `string`? Thankfully, I can call `ToString()` on any `object`. Ta-da! We have,

```CSharp
string id(object v)
{
    return v.ToString();
}
```

Are you happy now, Postel? I doubt it, because `id` is basically `object.ToString`, and it does not do what it says it will. It's a dead-end, and this interpretation clearly gets us nowhere.

## ID again, the correct interpretation

Now let's try to make sense of it the other way around. We start from a function that's quite similar to the previous `id` but only works on `string`.

```CSharp
string id(string v)
{
    return v;
}
```

Let's stick to the premise of a "given" implementation, in this case simply `return v`, which we will not change. Now we can follow the law,

1. choose the most generic input type
    Look at the implementation, it does not do anything specific to a `string` type; in fact, `return v` works for any type, for the most generic type here is ALL TYPES. This is not `object`, but *generics", so the input type should be generic `T`
2. choose the most specific return type
    There is a reason this should be the second step, because the return type can depend on the input type. In out case, what's the most specific type give input type `T`? Not much of a choice here, it must be `T`.

So the function should be turned into,

```CSharp
T id<T>(T v)
{
    return v;
}
```

Isn't it magical? From a function that only works on `string`, by following the law, we find a function that works on all types! Sure enough, `id` works on any type - `id(1) == 1`, `id(false) == false`.

This is an important discovery: Postel's law helps us *maximise the usefulness* of an implementation. It develops unfulfilled potential - it is the "life coach" for functions.

## A more complex example

If you are not convinced with the simple `id`, let's take another example to get some practice.

```CSharp
static Dictionary<char, int> CountChar(string chars)
{
return chars
    .GroupBy(c => c)
    .ToDictionary(g => g.Key, g => g.Count());
}

var counts = CountChar("Hello World");

// counts will be
// H - 1
// e - 1
// l - 3
// o - 2
//   - 1 (the white space)
// W - 1
// r - 1
// d - 1
```

Is there any used potential from `CountChar`? Let's follow the law!

Again let's stick to the premise: no change to the implementation! It's "given". Remember, constraints set us free - we can now focus on observing the implementation to find the most *generic" input.

This is quite similar to finding the common denominator of ALL types, in regards to the implementation. As impressive or intimidating as this may sound, it's usually pretty easy in practice (sometimes a smart IDE will even give it away for free!). In this case, all we need from the input type is to be able to call `GroupBy` on it. This says two things,

1. the input only needs to be an `IEnumerable<char>`, but wait...
2. we find there is nothing specific in the implementation to `char`, so input can be `IEnumerable<T>`

What about the output? Now we have nailed down input to `T`, the return follows and becomes `Dictionary<T, int>`.

```CSharp
static Dictionary<T, int> CountChar<T>(IEnumerable<T> chars)
{
    return chars
        .GroupBy(c => c)
        .ToDictionary(g => g.Key, g => g.Count());
}
```

Hold on - this function is much more useful than just counting `char`. It clearly works on any type `T`, so it should be renamed to `Dictionary<T, int> Count(IEnumerable<T> elements)`. What happened? We turned a function that only works on `string` and `char` to a much more useful one that works on any type!


## Return type

Consider the `Count` function again, this time let's look at the return type, `Dictionary<T, int>`. It's easy to forget that this type can also be many other types, as [listed here](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2?view=net-7.0#:~:text=MessageQuerySet-,Implements,ISerializable,-Examples), for example, `IDictionary<TKey,TValue>`, `IEnumerable<KeyValuePair<TKey,TValue>>` and `IReadOnlyDictionary<TKey,TValue>`. Why don't we make `Count` return `IDictionary<T,int>` or `IReadOnlyDictionary<T,int>`?

Firstly, as a proper subtype, `Dictionary<T, int>` implements all these types, and has all operations from each of these types. Here is the point: `Dictionary<T, int>` is *more specific*, and therefore has more (more accurately no fewer) operations than its super types. For example, `IDictionary<TKey,TValue>` has no method `Clear`, and `IReadOnlyDictionary<T,int>` has no method `Add`.

Give the same implementation that produces a `Dictionary<T, int>`, we would take away some operations if we were to use a less specific, although 100% correct return type, making the function less useful.

The more specific the type, the more operations, and the more useful to the callers - that's what Postel's law says about the return type. Again, it's about usefulness.

## Usefulness is not everything: input type

Postel's law really is good and helpful at addressing the question of *usefulness*, either for code, service or software systems. Indeed, it's a pretty good guideline to reconcile implementation against external requirements. So should we apply it whenever we have a chance? Of course not. Like many things in software, there is always context involved; applying any *one* thing unquestioningly is never the best idea.

Take this example,

```CSharp
string MakeTagForPerson(Person psn)
{
    return $"{psn.Name} from {psn.Location}";
}
```

The implementation of `MakeTagForPerson` uses only the `Name` and `Location` fields of the `Person`, by following Postel's law, we can rewrite it as below to make it more useful.

```CSharp
// option 1
string MakeTag(string name, string location)
{
    return $"{name} from {location}";
}

// option 2
string MakeTag(INameAndLocation nnl)
{
    return $"{nnl.Name} from {nnl.Location}";
}

// where as
interface INameAndLocation
{
    string Name;
    string Location;
}

class Person : INameAndLocation
{ ... }
```

Indeed, now the input type to `MakeTag` is much more generic (anything with `Name` or `Location` qualifies, not just the `Person` type), therefore the function is more *useful*, but is this necessarily desirable?

It depends. For example, we may want to keep using `Person` as the input type, because it gives us the flexibility of changing the implementation of `MakeTagForPerson`, such as by using a different field such as `Person.CountryOfBirth` or `Person.NickName`; such flexibility would be locked out if we choose to be too specific at this moment.

(In TypeScript, it's possible to require only the required operations without declaring a new type, such as `function makeTag<T extends { name: string, location: string }>(nnl: T)`. Powerful!)

## Usefulness is not everything: return type

We may not aways want to return the most specific type either. For `Dictionary<T, int> Count(IEnumerable<T> elements)`, I may want to return `IReadOnlyDictionary<T, int>` instead, if I want to enforce immutability, so the caller of `Count` cannot mutate the return value. This can be essential for optimisations such as memoisation: a mutable reference will back-propagate, spoiling it for other callers.   

```CSharp
static Dictionary<string, Dictionary<char, int>> store = new Dictionary<string, Dictionary<char, int>>();

static Dictionary<char, int> MemorisedCountChars(string chars)
{
    if (!store.ContainsKey(chars))
    {      
    store[chars] = chars.GroupBy(c => c)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    return store[chars];
}

var charCountsHelloWorld = MemorisedCountChars("hello world");
Console.WriteLine(charCountsHelloWorld['w']);   // 1
charCountsHelloWorld['w'] = 5;

var charCountsHelloWorldAgain = MemorisedCountChars("hello world");
Console.WriteLine(charCountsHelloWorldAgain['w']);  // 5, what's going on?!
```

With return type `IReadOnlyDictionary<char, int>`, the mutation would be blocked by the compiler.

```CSharp
static IReadOnlyDictionary<char, int> MemorisedCountChars(string chars)
{...}

// Property or indexer 'IReadOnlyDictionary<char, int>.this[char]' cannot be assigned to -- it is read only
charCountsHelloWorld['w'] = 5;
```

Point being, usefulness is not always the only virtue around, so it's not always desirable to maximise it without context.

## Generic == specific, what's going on?

You would have noticed some strangeness: to demonstrate making the input type more *generic*, the trick is to lock down the implementation so the operations on the input types are fewer, or, more *specific*. In another word, a more *generic* type is more *specific* because it has *fewer* options. This looks contradictory. What's going on?!

This is called "contra-variance": when two things change in opposite directions. In our case, the genericness of a type is contra-variant to the number of its operations. This is easy to see once we "counting the elements".

1. The more generic a type is, the more values it has; the more specific, the fewer values. Sub types have fewer values than super types;
2. The more specific a type is, the more operations it has; the more generic, the fewer operations. Sub types have more operations than super types.

Do you see how they change in opposite directions?

Remember the premise of "given a certain implementation", which means,

1. the required operations on the input values are fixed, and the types for these values are open for choice,
2. the actual return value (and its type) is fixed, but which operations to allow for the caller is open for choice

Hence we can boil down Postel's law to: *allow the most values for input by requiring the most generic types; provide the most operations on return by producing the most specific type". 

(Variance is discussed in more details in a [previous post](/contravariant)).