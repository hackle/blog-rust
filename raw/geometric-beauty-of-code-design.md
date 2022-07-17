With simple shapes to represent a program: circles for values and arrows for computations, we can reveal simple yet powerful ideas that can make big differences in how we see, design and implement software.

More importantly, there are geometric beauty to be found, awareness and observation of which can be rewarding.

## Statements vs Expressions, forward or backward?

Let's start with statements and expressions. Take this small example,

```
fun goodMorning(weather, time) {
    var isGoodMorning
    var isAm = time.AmPm == 'Am'
    if not isAm
        isGoodMorning = false

    val isSunny = weather.code == 'Sunny'
    if not isSunny
        isGoodMorning = false

    isGoodMorning = true

    return isGoodMorning
}
``` 

![statements](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/statement-based-flow.png)

The above code uses statements, as most of us were taught to do when learning programming. A statement does not return a value, instead it assigns to or mutates a variable, or has side effects such as writing to a file.

In our case, when an assignment is executed (`isGoodMorning = false`), it creates no new value; instead it mutates an existing variable `isGoodMorning` that is declared previously, hence the dotted lines that go backwards. Depending on the choice of mutations the outcome of the program is different.

Local variables require the arrows to go back locally, which is not THAT bad; class fields, global variables can be nastier, as they require the arrows go outside of the current code block; moreover, such variables are fair game, they can be mutated elsewhere, at arbitrary locations. We poor programmers must stay alert all the time: "Has `this.foo` changed since this code was last run?! Or would it when it is running?"

Alternatively, the same function can be implemented purely with expressions, and for complete lack of mutation.

```
fun goodMorning(weather, time) {
    val isAm = time.AmPm == 'Am'
    val isSunny = weather.code == 'Sunny'

    return (isAm and isSunny)
}
``` 

This can be represented as below.

![expressions](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/expression-based-flow.png)

We can see the expression-based implementation translates to a nice, one-directional diagram. Why one-directional? It's because,

* values cannot be mutated, so there is no need, and no way for arrows to go backwards
* a values is either used to build up more values, or returned at the end. Otherwise, it MUST BE unused and therefore redundant
* a result value can be rebuilt over and over with no difference, if its dependencies are also values or expressions (that never change!)
* this works equally well when global values are dependencies

These are incredibly powerful assurances to have, and it puts an end to the anxiety of variables being changed unexpectedly. This is what straight-**FORWARD** code really looks like - people may contend that statement-based programs can also be "simple" or "clear", that maybe, but remember, they will always be BACKWARDS in the literal sense.

## Loop vs Recursion

Let's look at this function that sums up numbers in a list.

```
fun sum(numbers) {
    var state = 0
    for (var p = 0; p < numbers.length; p++) {
        state = state + numbers[p]
    }

    return state
}
```

Simple enough, and it's illustrated as below.

![loop](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/loop.png)

Changes of `p` (the index), combined with the changes to `state`, lead to changes to `state` itself. Loops are knee-deep in statements.

It looks harmless enough at first sight, until we ask the question, *what was the value of `state` in the nth iteration*?

Sure we can add code such as `if (p == 1) then log(state)`, or introduce more code to keep the audit trail; the point is, without special care, past `state` gets overridden and disappears (like tears in the rain - sorry I couldn't help it).

For coding with immutability, loops are usually the first serious road block. The expression-based answer is none other than **recursion**, best implemented with pattern matching and induction. for our example,

```
fun sum(numbers, state) {
    match numbers {
        [] -> state,
        [n,...rest] -> sum(rest, state + n)
    }
}

sum([1,2,3], 0)

// this is the long form of 
[1,2,3].reduce((state, n) -> state + n, 0)

// or
[1,2,3].fold((+), 0)
```

And it is illustrated as,

![loop](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/recursion.png)

Here `P` stands for the parameters to the `sum` function, in this case, `numbers` and `state`. What's happening here with this shape that looks like a snail shell or a stair-well?

* A `state` is never mutated, it's either returned, or used to create the next `state`, combined with the gradually ("inductively") changing `numbers`
* an old `state` can be chucked away, or better yet, kept around. Thanks for lack of mutation, it's perfect for audit trails

Again, a simple idea that is not to be underestimated! This is behind some of the most powerful architecture styles or frameworks out there. Some reader would have recognised the similarity to fancier diagrams in the wild, buzzwords and phrases such as Reactive, Redux, Event-driven, Event-sourcing, One-directional data-flow, Time-traveling, etc.

*One-directional* - does that remind you of expressions? And hello, *Reducers*!

## Exceptions vs Unions

Previously we compared [error handling with values and expressions](/go-lang-error-handling), also with diagrams, which can be brought into the mix. About time!

Exception-based error handling allows us to present very neat code - seemingly.

```
fun calcDiscount(memberId) -> DiscountRate {
    member = readMember(memberId)
    purchases = findPurchases(memberId)
    discountRate = calcDiscountRate(member, purchases)

    return discountRate
}

```

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/exception-error-handling-naive.png)

But this is an illusion at best, because as we all know - each of these innocent looking function can throw exceptions and blow up `calcDiscount`, as it doesn't take special care to `catch`!

![expression facts](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/exception-error-handling-fact.png)

To recap, these below questions are never really answered satisfyingly (despite noble efforts from Java)

* which exception has already been caught and handled?
* Which code could throw what exceptions? This is usually not answered with types (if ever tried in Java, it's usually circumvented when exceptions stack up), but with documentation, or worse, with source code.

Something worse but less talked about. As exceptions could carry arbitrary payload, in a way, they actually account for arbitrary return types for any code. It's dynamic typing in disguise. A loop-hole in many so called "strongly-typed" languages.

On the contrary, value based error handling, especially with the support of union types, brings sanity.

```
// Rust style binding, and_then applies to happy path and short-circuits errors
fun calcDiscount(memberId) -> DiscountRate | Error {
    return readMember(memberId).and_then(
        member -> findPurchases(memberId).and_then(
            purchases -> calcDiscountRate(member, purchases)
        )
    )
}

// or F# style binding, let! will return early when an Error is encountered
fun calcDiscount(memberId) -> DiscountRate | Error {
    let! member = readMember(memberId)
    let! purchases = findPurchases(memberId)
    let! discountRate = calcDiscountRate(member, purchases)
    return discountRate
}
```

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/union-error-handling.png)

What's the difference?

* An error case demands immediate attention, it must be handled, for example, with pattern matching on Union types (just like nullable types!)
* A clear "error path" runs in parallel to the happy path, which usually short-circuits and return immediately

This is not **nearly** as smart as exception-based error handling, and requires much less magic. It can be more verbose in simpler languages (as is the case with Go), but when supported with more advanced facilities (as in Rust, F#, Elm and Haskell), it can look very neat, as in the example above.

Syntax aside, this style of error handling can assure us that, 

* no unexpected long jumps will take place, EVERYTHING happens locally
* clear knowledge and control of error/happy path

Such assurances scale incredibly well with lines of code and aggregation of complexity.

## Inheritance vs Union

Previously we discussed one big difference between [designing with inheritance and Unions](/dont-close-what-is-open). To recap,

* an inheritance hierarchy is meant to be **OPEN**, as it's always possible to add more implementations to an interface; such addition shouldn't require changing existing code
* an union type is **CLOSED**; if a new variant is added to a union, existing code should break as pattern matching against this union is now non-exhaustive. (therefore, use of wildcards for pattern matching should be considered an anti-pattern)

An inheritance-based design can be illustrated as below,

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/branch-with-classes.png)

Consider the popular "Strategy" design pattern. The idea is to branch as early as possible to choose the applicable "Strategy", after that, following code path should not care which implementation has been chosen; it's an anti-pattern to peek the type of the chosen strategy to introduce ad-hoc logic, such as 

```
// don't do this - it's an anti-pattern!
if (chosen_strategy.getType() == typeof(PremiumCustomerStrategy)) {
    discountRate = MAX_DISCOUNT
} else {
    discountRate = NORMAL_DISCOUNT
}
```

When a new implementation is added, a new branch appears, which shouldn't interfere with existing branches, nor should it require changes to existing implementations; this is the beauty of well thought-out object-oriented design.

The story and the diagram are both quite different with Unions. With the assurance of a union type being closed, and exhaustive checking that's usually provided by languages, we are empowered to embrace branching.

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/branch-with-union.png)

This will look more verbose than the inheritance-based diagram at first sight, but it affords extra benefits,

* there is no pressure to branch early and once for all
* it enables flexible composition with other unions; for example, pattern matching on two unions is trivial
    ```
    match (result1, result2) {
        (Err err1, Err err2) -> ...
        (Ok  res1, Err err2) -> ...
        ...
    }
    ```

You would found the similarity in the diagrams - union type is what enables value-based error handling. It's quite a handful to design and implement with inheritance - despite many noble attempts!

## In closing

I hope the diagrams in this post help shed lights on some of the choices made in day-to-day programming, and how such choices can result in different levels of conceptual simplicity/complexity.

It's a misconception that we only need to call for simplicity only required when things get complex, this is not the case! Simplicity scales truly if it's respected from the get-go; as complexity aggregates, so should the assurances of correctness, true scalability and geometric beauty.
