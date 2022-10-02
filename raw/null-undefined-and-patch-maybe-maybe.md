A pretty embarrassing thing with imperative programming is: it's not always possible to tell the difference between "never set" or "set to default value".

If your answer is `null` (or `nil` or `None`) to both, we need to talk.

You see, for a long time `null` is said to represent the "lack of value"; but it's clearly not always true: in many languages, `null` can be assigned to variables, and passed around, it's typically first-class.

(By comparison, `void` indicates "lack of value" much better, and [should be heeded](/dishonest-code-void-vs-unit).)

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

And let me ask you this: when `person.Nickname` is `null`, how do I know if it's because,

1. `person.Nickname` is ever given a value, as with `new Person()`, or 
2. its value is explicitly set to `null`, as with `new Person(Nickname = null)`?

```CSharp
// possibility 1
Update(new Person());

// possibility 2
Update(new Person { Nickname = null });
```

Well, the answer is, by looking at the value alone, there is no way to tell!

This may not look a big deal, like many things, `null` is meant to work "most of the time".  

## Pydantic: unset null vs set null

`Pydantic` is a great Python library that handles data validation amongst many other things.

It has this notion of `unset`. See,

```Python
from typing import Optional
import pydantic


class Person(pydantic.BaseModel):
    nickname: Optional[pydantic.StrictStr]

person1=Person().dict(exclude_unset=True)
print(f"{person1}")
# {}

person2=Person(nickname=None).dict(exclude_unset=True)
print(f"{person2}")
# {'nickname': None}
```

See, it works beautifully. Although now we have two kinds of `null`: the *default* `null`, and the *explicit* `null`. The Pydantic model must somehow keep an internal state on which fields has been set a value *explicitly*.

A good guess would be this is done by using some internal states to keep track which field is set - this is good engineering, as it's typically what it takes to get us out of a "jam"; it doesn't solve the problem from the root. Now a `null` field must be viewed alongside an internal state? Come on.

## undefined FTW

JavaScript solves this problem beautifully: `undefined` is the solution to the implicit `null`, aka "a value is never given". `null` is just `null`. See,

```JavaScript
> {}.nickname
undefined

> {"nickname":null}.nickname
null
```

This lets us write,

```JavaScript
if (person.nickname === undefined) {
    // person.nickname is never set!
} else if (person.nickname === null) {
    // person.nickname is explicitly set to null
}
```

The semantics are very clear: `undefined` clearly states `person.nickname` is never given a value; `null`, on the other hand, is a value in presence.

We still have the question of how to stop people from abusing `undefined`? Indeed, many engineers seem to confuse `undefined` with `null`, and it's not unusual to see them used interchangeably, completely throwing away the benefit of `undefined` as the signal of "value not yet given".

Nevertheless, the engineers are at fault here; the idea to differentiate `undefined` and `null` is sound; we need to do better at putting them in good use.

## TypeScript: why ask for undefined?!

Now we can see `const foo = null` is fine, but `const foo = undefined` does not make as much sense, or it's at best unnecessary. Stating `foo` is `undefined` is not much different than stating Hackle is not a billionaire, nor a space traveller; plus EVERYTHING is `undefined` until it's defined.

This gives rise to funny code like this,

```JavaScript
> function eq(a, b) { return a === b; }
> eq();
true
```

(I am aware people use the likes of `person.nickname = undefined` to reset the `undefined` state. As it's effective in `JSON.stringify({ nickname:undefined }) === JSON.stringify({})`).

The point being, leaving something uninitialised is enough to secure "undefinedness", as in this function in TypeScript,

```TypeScript
type Person = { nickname?: string } // nickname?: string | undefined;
const person: Person = {};  // this is fine
```

AFAIK, this is desired behaviour. However, things are not always peachy.

```TypeScript
type Person1 = { nickname: string | undefined };

// ERROR: Property 'nickname' is missing in type '{}' but required in type 'Person1'.ts(2741)
const person1: Person1 = {};    

// this works but yucks!
const person2: Person1 = { nickname: undefined };
```

Supposed I want to get even fancier: `nickname` should only be required if `hasNickname` is true. Reasonable right? 

```TypeScript
function greet<T extends boolean>(
    hasNickname: T, 
    nickname: T extends true ? string : undefined
) {
    return hasNickname ? `Hello ${nickname}!` : `Hello there!`;
}

const greet1 = greet(true, 'Hacks');

// An argument for 'nickname' was not provided.
const greet2 = greet(false);

// works but yucks again!
const greet3 = greet(false, undefined);
```

Really, TypeScript should not be asking for an explicit `undefined`!

PS it's possible to get this example working with overloads.

```TypeScript
function greet(hasNickname: false): string;
function greet(hasNickname: true, nickname: string): string;
function greet(hasNickname: boolean, nickname?: string): string {
    // implementation
}
```

## undefined + PATCH

`undefined` is the most useful when dealing with user input, such as JSON from an HTTP request.

In this example, a `Person` record can be updated with a `PATCH`.

```JavaScript
PATCH /person/1 
{ "name": "Hacks", "nickname": null }
```

Notice the explicit `null`, it clearly indicates `nickname` should be set to `null`. What about `undefined`?

```JavaScript
PATCH /person/1 
{ "name": "Hacks" }
```

`nickname` will be `undefined` after `JSON.parse`. For a `PATCH`, this could be interpreted (rightfully so) as "no action required" or "keep as is".

See, `undefined` and `PATCH` are a match made in heaven. The semantics is perfect.


# without undefined

Many programmers laugh at JavaScript for having `undefined`, without knowing it's really a luxury of a feature. For example, most serialiser in other languages would not be able to make the differentiation. 

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

    // this writes: True
    Console.WriteLine (person1 == person2);
  }
}
```

It's the problem from the beginning: `null` is used for both "no value ever given" and "null value is given". Therefore, it's not possible to tell if the user is trying to communicate "keep nickname as is" or "reset nickname to null"?

## go lower

As it's usually the case, the way out of this is to take a step back, otherwise referred to as "abstraction leak". For our example, either the typical behaviour of serialisers fail us, or C# as a language does not allow us to express such nuance as elegantly as we want.

So we break the abstraction and arrive at a level lower - JSON objects. This is done pretty easily in C# with the mysterious `dynamic` keyword!

```CSharp
var person1 = JsonSerializer.Deserialize<dynamic>("{\"name\":\"Hacks\"}");
var person2 = JsonSerializer.Deserialize<dynamic>("{\"name\":\"Hacks\",\"nickname\":null}");

// person1 is a System.Text.Json.JsonElement
Console.WriteLine(person1);
{"name":"Hacks"}

Console.WriteLine(person2);
{"name":"Hacks","nickname":null}
```

However, not many people will be happy to deal with JSON objects directly. We must choose convenience over correctness, when the cost of correctness is ... inconvenient.

But this does not stop at `PATCH`. It's also quite possible that `nickname` is a new field added to the `Person` contract. I know, people will be shouting - the contract should be versioned! But for the sake of discussion, let's assume not everyone is ready to meet the versioning hell. So we are faced a few interpretations when `nickname` is `null` after deserialisation, for the same `PATCH` endpoint.

1. user wants to keep `nickname` as is
2. user wants to reset `nickname` to `null`
3. the client side is yet to be aware of `nickname`, and it's setting `nickname` to `null` for any record unconsciously
4. the client side is aware of `nickname`, and is setting `null` values consciously 

There is a lot more guessing required here to get this right! In fact, I find this unsettling.

## Types again

Although lacking the much coveted union type, many static-typed languages have the de-facto union type: any reference type is a union of itself and null. `string` is actually `string | null`, `Person` is actually `Person | null`, etc.

As it will be non-trivial to add another type to the union, JavaScript will have the edge of `undefined` for quite a few years to come.

Do languages with stronger types handle this well? Not necessarily. Take this example in Haskell,

```Haskell
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

This is not much different than the C# example: missing == null. There is no way to differentiate.

How could this be expressed better? Utilising Haskell's tagged unions, we could introduce a new type such as `data MaybeUndefined a = Undefined | a`. Good, except this is essentially the same as `Maybe`. Using `Person` as example,

```Haskell
data Person = Person { 
  name :: Text, 
  nickname :: Maybe (Maybe Text)
}
```

Now we have a few variants

1. `Nothing` - the `nickname` field is missing, i.z. no value is given
2. `Just Nothing` - a `null` value is set explicitly
3. `Just (Just "Hacks")` - a value other than `null` is given

It's more verbose, but more accurate and can be just what gets us out of a jam, when the need for differentiation arises.

Unfortunately this neat technique only works for tagged unions. Untagged union collapses - for example, in `TypeScript`, `Optional<T>` is the same as `OptionalOptional<T>`, proof below,

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

While Python may lament the lack of alternatives, it doesn't matter for JavaScript / TypeScript for the existence of `undefined`!

## Start-over with Immutability 

This is how we backed ourselves into a corner, when trying to patch up a questionable design.

Quite the rabbit hole isn't it? And it would seem nearly impossible to get right.