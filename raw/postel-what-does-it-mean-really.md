Postel's law is a simple law about one thing: maximising the potential of a program. But people have managed to make it one the most confusing "laws" in software engineering.

Look how many versions there are! [Wikipedia](https://en.wikipedia.org/wiki/Robustness_principle) lists three.

1. "be conservative in what you do, be liberal in what you accept from others". This sounds very religious, or "1984", or some cliche from a mind-controlling authority. 
2. "be conservative in what you send, be liberal in what you accept".  Great - this is more specific to software. Still, isn't it a bit masochistic? What happens to "Do unto others as you would have them do unto you?"
3. "be contravariant in the input type and covariant in the output type". Worthy competition against "monad is just a monoid in the category of endofunctors"?

You would have come across other versions, such as "take the most generic input, give the most specific output", which might not make a hell lot of sense either.

Although confusing, these are all valid interpretations. And I can assure you, Postel's law is a useful law - we just need a much simpler interpretation. Let's see if that can be done.

## Postel's law is about Types!

**Given an implementation, choose the most generic input type(s), and the most specific return type.**

Isn't this much clearer?

Do you see what's been missing from the other explanations? The premise: "Given an implementation". Without this premise, the law does not make much sense.

## ID, the wrong interpretation

Let's use the simplest example, the `id` function that takes anything and returns it straight-away. 

```CSharp
T id<T>(T v)
{
    return v;
}

// much simpler in Haskell
id :: a -> a
id a = a
```

Now suppose I want to follow Postel's law literally without considering the implementation. "Take the most generic input", great! What's the most generic type in C#? It's `object`. So I should write.

```CSharp
T id<T>(object v)
{
    return v;
}
```

Next, what's the most specific return type? Well, any specific type is quite specific to itself, so I should be right to choose `string`? It looks to work because I can call `ToString()` on any `object`. Ta-da! We have,

```CSharp
string id(object v)
{
    return v.ToString();
}
```

Are you happy with the result? I doubt it, because `id` is basically `object.ToString`, and it does not do what it says. This interpretation clearly gets us nowhere - a dead-end.

## ID again, the correct interpretation

Now let's try to make sense of it the other way around. We start from a function that's quite similar to the previous `id` but only works on `string`.

```CSharp
string id(string v)
{
    return v;
}
```

This time, let's stick to the premise of a "given" implementation, in this case simply `return v`, which we will not change. Now we can follow the law,

1. choose the most generic input type.

    Look at the implementation, it does not do anything specific to a `string` type; in fact, `return v` works for *ALL* types, it's quite *generic*! What's the most generic type? It's actually not `object`, but *generics", so the input type should be generic `T`. Which, in case you haven't heard, is shorthand for `forall T.`

2. choose the most specific return type

    There is a reason this should be the second step, because the return type can depend on the input type. In our case, what's the most specific type give input type `T`? Remember `T` can be ANY type, so there is not much of a choice here, it must be `T`.

Therefore, the function should be turned into,

```CSharp
T id<T>(T v)
{
    return v;
}
```

Isn't it magical? From a function that only works on `string`, by following the law, we find a function that works on ALL types! Sure enough, `id` works on any type - `id(1) == 1`, `id(false) == false`.

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

Again let's stick to the premise: no change to the implementation - it's "given". This constraint sets us free - we can now focus on observing the implementation to find the most *generic* input.

How do we do that? It's easy! We find the "lower common denominator" type from the *operations* used in the implementation. In this case, what are the operations on the input `string chars`? It's 

1. `GroupBy(c => c)` which does nothing specific to `c` so it should work on any type, then,
2. `ToDictionary(g => g.Key, g => g.Count())`, which again does not require its element to be any specific type

Now we need to find the "lower common denominator" for these two operations. Oh I have one, what about `IEnumerable<T>`? If we put that in, and change the return type accordingly to `Dictionary<T, int>`, we get,

```CSharp
static Dictionary<T, int> CountChar<T>(IEnumerable<T> chars)
{
    return chars
        .GroupBy(c => c)
        .ToDictionary(g => g.Key, g => g.Count());
}
```

Hold on - this function is much more useful than just counting `char`. It clearly works on any type `T`, so it should be renamed to `Dictionary<T, int> Count<T>(IEnumerable<T> elements)`. See what's happened? We turned a function that only works on `string` and `char` to a much more useful one that works on any type. Postel's law strikes again!

## Return type

Consider the `Count` function again, this time let's look at the return type, `Dictionary<T, int>`. It's easy to forget that this type can also be many other types, considering the inheritance hierarchy, as [listed here](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2?view=net-7.0#:~:text=MessageQuerySet-,Implements,ISerializable,-Examples), for example, `IDictionary<TKey,TValue>`, `IEnumerable<KeyValuePair<TKey,TValue>>` and `IReadOnlyDictionary<TKey,TValue>`. So why don't we make `Count` return `IDictionary<T,int>` or `IReadOnlyDictionary<T,int>`?

Here is the point: `Dictionary<T, int>` is *more specific* than any of its super types, and therefore has more (more accurately no fewer) operations. For example, `IDictionary<TKey,TValue>` has no method `Clear`, and `IReadOnlyDictionary<T,int>` has no method `Add`.

Give the same implementation that produces a `Dictionary<T, int>`, we would take away operations from the caller if we were to use a less specific, although 100% correct return type, making the function *less useful*.

The more specific the return type, the more operations, and the more useful to the callers - that's what Postel's law says about the return type. Again, it's about usefulness. More on this soon.

## Usefulness is not everything: input type

Postel's law really is good and helpful at addressing the question of *usefulness*, either for code, service or software systems. Indeed, it's a pretty good guideline to reconcile implementation against external requirements. So should we apply it whenever we have a chance? Like many useful principles and guidelines in software, the answer is "no". It is always contextual.

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

// whereas
interface INameAndLocation
{
    string Name;
    string Location;
}

class Person : INameAndLocation
{ ... }
```

Indeed, now the input type to `MakeTag` is much more generic (anything with `Name` or `Location` qualifies, not just the `Person` type), therefore the function is more *useful*, but is this necessarily desirable?

It depends. For example, we may want to keep using `Person` as the input type, because it gives us the flexibility to change the implementation of `MakeTagForPerson`, such as by using a different field `Person.CountryOfBirth` or `Person.NickName`; such flexibility would be locked out if we choose to be too specific prematurely.

(In TypeScript, it's possible to require only the required operations without declaring a new type, such as `function makeTag<T extends { name: string, location: string }>(nnl: T)`. Powerful!)

You can see how this becomes more important for public APIs or service contracts: it's usually smart to leave a bit of wriggle room at the time of design. Once the requirements are made public, it's "fair game" for the consumers; any input should be considered valid when the requirements are met. Adding more requirements is considered a *breaking change*, and rightfully so!  

## Usefulness is not everything: return type

We may not aways want to return the most specific type either. For `Dictionary<T, int> Count(IEnumerable<T> elements)`, I may want to return `IReadOnlyDictionary<T, int>` instead, if I want to enforce immutability to prevent the caller from mutating the return value. This can be essential for optimisations such as memoisation: a mutable reference will back-propagate, spoiling it for other callers.   

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

Point being, usefulness is not always the only virtue, and it's not always desirable to maximise it without considering other virtues.

Suffice to say, following Postel's law naively can get us into trouble.

## Generic == specific, what's going on?

You would have noticed some strangeness: to demonstrate making the input type more *generic*, the trick is to lock down the implementation so the *operations* on the input types are fewer, or, more *specific*. In another word, a more *generic* type is more *specific* because it has *fewer* options. There seems to be a few contradictions... What's going on?!

At its core lies "contra-variance". (Yes, again!) That is, when two things change in opposite directions. In our case, the genericness of a type is contra-variant to the number of its operations. This is easy to see once we "count the elements".

1. The more generic a type is, the more values it has; the more specific, the fewer values. For being more restrictive and specific, sub types have fewer values than super types
2. The more specific a type is, the more operations it has; the more generic, the fewer operations. Sub types have more operations than super types.

Do you see how genericness and number of operations change in opposite directions?

Remember the premise of "given a certain implementation", which means,

1. Input: the required operations on the input are fixed, but it's open for choice what types to require from the caller,
2. Output: the actual return value is fixed, but it's open for choice which operations to allow for the caller (via choosing a super type for the return value)

Hence we can boil down Postel's law to: 

**Allow the most values for input by requiring the most generic types; Allow the most operations on return by producing the most specific type.**

(Variance is discussed in more details in a [previous post](/contravariant)).