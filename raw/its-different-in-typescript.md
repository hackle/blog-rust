When I first started with TypeScript a few years ago, it had a familiar set of features that really made me feel at home: interfaces, classes (even abstract and static!), enums, so off I went and had a kick writing my C# in TypeScript. Only it was missing one killer feature: reflections. But life was good.

It didn't take long for me to get this nagging feeling that something was off, it was when I started to read more literature online about how the others were using TypeScript; it appeared as if they use a different language, and there were features that appeared magical, how come?!
 
The smooth transition must have been a desired quality for adoption of TypeScript, however after a few project it became quite clear to me such "benefits" are quickly offset by the pain it can cause down the stretch. I needed to unlearn the "beginner" material, and reset at some point of time to relearn a lot of things. This is not a natural continuation; there was a backward step.

I wonder if this is the strategy adopted by many cross-paradigm languages; I have certainly heard about F# or Scala beginners abusing mutation to create some awful programs that must be rewritten later on, or consider it a fortunate case if immediately. I wonder if there really is such a thing as a cross-paradigm codebase, it appears paradoxical. There is preferred style, and exceptions; there is no free mix of imperative and declarative. Not how one group of programmer should accept how they structure their codebase.

In the case of TypeScript, it's quite clear: some of its most powerful features have very little overlap with most main-stream programming languages; yes it does a decent job of supporting object-oriented programming style, and maybe it's reason enough for people to come to TypeScript - "oh it's just like C#, I am sold!"; but that also gives some people the wrong idea that they would wait for Blazor takes over, and they wouldn't have missed a single thing. Those with exposure to the essential TypeScript features would know very well: oh are these people missing out!

With this prolonged prelude let's start looking at things that I consider breaking points, where at least for myself TypeScript reveals its superpower, that took me a leap of faith to come to terms with, to part ways with previous ways of coding. Ok, here we go!


# make literal types, not constants

Some people would think I am either joking or mad when I say TypeScript allows us to program with stronger typing than most other main stream languages. Let's see, types are meant to constraint values; the stronger the constraints can be made, the stronger is typing.

```TypeScript
function isGameDay(weekendDay: 'Saturday' | 'Sunday'): boolean {
  return weekendDay === 'Saturday';
}

console.info(isGameDay('Saturday'));
```

Those we are foreign or new to literal types would be mad at the presence of all these strings, and would scream for constants to be added or reject this pull request. Those who know about literal types would appreciate the power here.

* first of all, `'Saturday' | 'Sunday'` is a type, not plain strings
* `weekendDay` is restricted to exactly two options as we want it. This might be the strongest possible constraint on type level one can ask for. Calling `isGameDay` with any other value results in a compiler error.
* for the same reason, TypeScript will reject `Monday` or `March 1`, so there is no need to write extra code or test to check `weekendDay` against such bad inputs. 

Now let's see this to in Kotlin,

```Kotlin
fun isGameDay(weekendDay: String) = weekendDay === "Saturday"

fun main(args: Array<String>) {
  println(isGameDay("Saturday"))
}
```

Many may feel more comfort with the use of `String` here, but this version of `isGameDay` in Kotlin is inadequate: it needs more code for runtime input validation, as there is no way to express that `weekendDay` is either Saturday or Sunday.

So, what do literal types change?
* not all string literals must be made constants (it's questionable anyway, not all literals are "magic"). Instead, trying make them types
* literal types are much, much stronger than conventional primitive types

So next time you see a bunch of "strings" in a TypeScript code base, first check if they are types or values? 

# Use unions, not enums

`enum` is one of the strange things introduced in the early days of TypeScript. It's undoubtedly a comfort feature for C# users, like other similar features, it makes it easier for people to make the transition, but may not be the best idea long-term. 

Consider the `weekendDay: 'Saturday' | 'Sunday'` again, chances are a C# user would reach for `enum WeekendDay = { Saturday, Sunday }`. This itself is not a problem; however, by making this choice we would be saying goodbye to a school of features that are only available to unions.

```TypeScript
type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
type WeekendDay = 'Saturday' | 'Friday';
type Week = Weekday | WeekendDay;               // addition
type FourDayWeek = Exclude<Weekday, 'Friday'>;  // subtraction
```

TypeScript really makes manipulating union types a breeze; the expressive power we can gain from using unions is never seen with enums in C# or Java.

Needless to say the above is not possible with 7 string constants. Sold?

It's important to differentiate more potent enums from the primitive ones; enums in Swift and Rust are proper union types; 

# Use JSON, not classes

# Stop writing interfaces for everything!

Official TypeScript documentation recommends using `interface` over `type` when everything else being equal for good reasons, one of them being performance. However, I would always prefer using `type`

# Infer types, not write them

# Write less code, not more

# Declare, not mutate