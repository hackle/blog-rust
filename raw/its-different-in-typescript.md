
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

# use unions, not enums

`enum` is one of the strange things introduced in the early days of TypeScript. It's undoubtedly a comfort feature for C# users, like other similar features, it makes it easier for people to make the transition, but may not be the best idea long-term. 

Consider the `weekendDay: 'Saturday' | 'Sunday'` again, chances are a C# user would reach for `enum WeekendDay = { Saturday, Sunday }`. This itself is not a problem; however, by making this chocie

# use JSON, not classes

# stop writing interfaces for everything!

Official TypeScript documentation recommends using `interface` over `type` when everything else being equal for good reasons, one of them being performance. However, I would always prefer using `type`

# infer types, not write them

# write less code, not more