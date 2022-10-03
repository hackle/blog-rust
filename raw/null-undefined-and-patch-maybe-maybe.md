So you know what `null` is, but have you heard about *explicit* `null` and *implicit* `null`?

We are told `null` represents the "lack of value"; but it's clearly not always true: in many languages, `null` (or `nil`, `Nothing`) is a value that can be assigned to variables, and passed around, and definitely first-class.

It's a bit embarrassing to say, but maybe we DON'T know what `null` is?

## null: never set, or explicitly set?

Consider the below method in C#,

```CSharp
public class Person
{
    public string Nickname;
}

// in some other class
string Update(Person person) 
{
    if (person.Nickname == null) 
    {
        // what to do?
    }
}
```

And let me ask you this: when `person.Nickname` is `null`, how do I know if it's,

1. an implicit `null` that is ever given a value, as with `new Person()`, or 
2. an explicit `null` as with `new Person(Nickname = null)`?

The answer is, by looking at the value alone, there is no way to tell!

What's the big deal, you say. If this never bothers you, great; but if it does, then you know it can actually be a big deal.

## JSON merge PATCH

One famous use case for differentiating explicit and implicit `null`, is [JSON merge PATCH](https://www.rfc-editor.org/rfc/rfc7386).

Let's say this `Person` record is currently saved in the data store.

```JavaScript
{ "id": 1, "name": "Hackle", "nickname": "Hacks" }
```

And a client wants to reset the `nickname`, so it sends a `PATCH` request.

```JavaScript
PATCH /person/1 
{ "nickname": null }
```

Notice the *explicit* `null`, it clearly indicates `nickname` should be set to `null`. A good server implementation should update the record so it looks like,

```JavaScript
{ "id": 1, "name": "Hackle", "nickname": null }
```

This is a non-issue for JavaScript, because it's dynamically type? Not just. Also because JavaScript differentiates `null` and `no value is given`, a.k.a. `undefined`. So imagine the server-side written in Node can do,

```JavaScript
if (person.nickname === undefined) {
  // do nothing!
}
```

A stroke of genius indeed! Now we know `undefined` is nothing to sneeze at. 

Other languages may not be so lucky.

# Lossy serializers

Suffice to say, JSON merge PATCH is a pain to implement in a statically typed language like C#. Why? Let's look at the example below,

```CSharp
using System;
using System.Text.Json;

record Person
{
  public string Name;
  public string Nickname;
}

class Program {
  public static void Main (string[] args) {
    var person1 = JsonSerializer.Deserialize<Person>("{\"name\":\"Hacks\"}");
    var person2 = JsonSerializer.Deserialize<Person>("{\"name\":\"Hacks\",\"nickname\":null}");

    Console.WriteLine (person1 == person2);
    // outputs: True
  }
}
```

For all it's static typing, C# cannot tell implicit null from explicit null. Is `nickname` set to `null` in the JSON request body, or not set at all? Don't know!

Some very useful information is lost. It's a dead end.

Should we blame the serialiser? Maybe not.

## Way out: a step back

Maybe the serializer should not take the blame here. Most serializers support deserializing into a dynamic hashmap. After all, a JSON object is nothing other than a map itself.

See how this is done pretty easily in C# with the mysterious `dynamic` keyword!

```CSharp
var person1 = JsonSerializer.Deserialize<dynamic>("{\"name\":\"Hacks\"}");
var person2 = JsonSerializer.Deserialize<dynamic>("{\"name\":\"Hacks\",\"nickname\":null}");

// person1 is a System.Text.Json.JsonElement
Console.WriteLine(person1);
{"name":"Hacks"}

Console.WriteLine(person2);
{"name":"Hacks","nickname":null}
```

You see, the serializer is totally capable of differentiating between `undefined` and `null`. Why don't we use `dynamic` instead? What's the problem?!

The problem is we MUST have **convenience**! Deserialising a JSON object to a "strongly-typed" model is golden standard, even at the cost of information loss! Nobody wants to break the standards, what are we, anarchist?

So this is the core of the problem: for the sake of correctness (strong typing), we accept information loss, which undermines correctness. This is the real dead end!

## Types again

Boy did the JSON merge Patch problem make engineers scramble. But if there is one thing engineers do well, is to work around problems by PATCHing (pun intended) over them.

It's too late to introduce `undefined` to existing type systems, so the Java peeps are quick to copy `undefined` from JavaScript, with [JsonNullable](https://github.com/OpenAPITools/jackson-databind-nullable). ASP.NET users love their model binding so a [library must be made to suit](https://github.com/Morcatko/Morcatko.AspNetCore.JsonMergePatch).

Wait, Haskell has `undefined`, although, it's not supposed to be touched.

```haskell
ghci> undefined
*** Exception: Prelude.undefined
CallStack (from HasCallStack):
  error, called at libraries/base/GHC/Err.hs:74:14 in base:GHC.Err
  undefined, called at <interactive>:2:1 in interactive:Ghci1
ghci> undefined == undefined
*** Exception: Prelude.undefined
CallStack (from HasCallStack):
  error, called at libraries/base/GHC/Err.hs:74:14 in base:GHC.Err
  undefined, called at <interactive>:3:1 in interactive:Ghci1
```

Give its prestige as a language and community, surely Haskell peeps have handled this with flying colours? Not necessarily. Take this example with `Aeson`,

```haskell
import Data.Aeson
import Data.Text
import GHC.Generics

data Person = Person { 
  name :: Text, 
  nickname :: Maybe Text 
} deriving (Generic, Show)
instance FromJSON Person

person = decode "{\"name\":\"Hacks\"}" :: Maybe Person

main :: IO ()
main = do
  putStrLn $ show person

-- prints
Just (Person {name = "Hacks", nickname = Nothing})
```

Instead of implicit `null` we have implicit `Nothing`, not much different than C#. It looks like the core of the problem is not with languages but with conventions, and conventions go deep.

## Maybe Maybe?

So we really love so called "strong-typing" too much, and never want to regress into using JSON objects directly, are we stuck with JavaScript for JSON merge PATCH? What are the options? 

If we could change the conventions just a little, there may be alternatives. For example, utilising Haskell's tagged unions, we could introduce a new type such as `data MaybeUndefined a` as below. Missing fields deserialise into `Undefined`, otherwise their intended type `a`, which can be nullable itself. For example,

```haskell
data MaybeUndefined a = (FromJSON a) => Undefined | a

data Person = Person { 
  name :: Text, 
  nickname :: MaybeUndefined (Maybe Text)
}
```

Now we have deterministic interpretation,

1. `Undefined` the `nickname` field is missing, i.z. no value is given
2. `Defined Nothing` - a `null` value is set explicitly
3. `Defined (Just "Hacks")` - a value other than `null` is given
4. `None`: deserialization has failed

(NOTE: I have not managed to implement this with Aeson)

This technique would slot in pretty naturally for tagged unions, but not so well for untagged unions which collapse - for example, in `TypeScript`, `Optional<T>` is the same as `OptionalOptional<T>`, proof below,

```TypeScript
type Optional<T> = T | undefined;
type OptionalOptional<T> = Optional<T> | undefined;

type StrictEq<T, U> = 
    [T] extends [U] 
    ? [U] extends [T] 
        ? true : false 
    : false;

// Type 'false' is not assignable to type 'true'.ts(2322)
const areEqual: StrictEq<Optional<string>, OptionalOptional<string>> = false;
```

This is hardly the end of the world but it does mean more heavy-handed wiring is needed to introduce the type level equivalent of `undefined`.

## Contract Versioning

Worth noting this issue does not stop at `PATCH`.

Let's say for our wildly popular endpoint, `nickname` is a new field added to the existing `Person` contract. And let's assume people are wary of versioning hell so that's not an option.

For the various client sides, this should be completely backward compatible, right? Not really.

When a `PATCH` request is received, we are faced with even more interpretations when `nickname` is `null` after deserialisation.

1. user wants to keep `nickname` as is, or
2. user wants to reset `nickname` to `null`, or
3. the client side is yet to be aware of `nickname`, or
4. the client side is aware of `nickname`, and is setting `null` values consciously 

Too much guessing required! And a real recipe for disaster.

## In closing

Who would have thought JSON merge PATCH would bring so much envy for `undefined` and JavaScript?

Isn't interesting, and maybe a bit sad, that how much trouble `null` is still causing us? Even the more modern, powerful languages are no exception, because the conventions are pervasive and run deep.

But these languages do have the edge of extra expressive power, which helps to make the solution less wacky and more elegant. All we need to fight are the conventions - but would we be able to?