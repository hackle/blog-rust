If we use the simplest elements to represent a  program: circles for values and arrows for computations, we can reveal some simple but powerful ideas that can make big differences in how we see, design and implement software.

More importantly, there are geometrical beauty in programming. Awareness and observation of such beauty can help very rewarding.

## Statements vs Expressions, forward or backward?

Let's start with statements and expressions. Take this small example,

```
fun goodMorning(weather, time) {
    var isGoodMorning
    var isAm = time.AmPm != 'Am'
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

This routine function uses statements, as most of us were taught to do with main stream languages. A statement does not return a value, in this case, it's in the form of assignment or mutation. 

When assignment happens, the execution seems to stop, with the side-effect that the variable `isGoodMorning` is mutated, hence the dotted lines that go backwards (as `isGoodMorning` is declared prior to assignments). Depending on the choice of mutations the outcome of the program is changed.

Local variables require the arrows to go back locally, which is not THAT bad; class fields, global variables can be way nastier, as the arrows go outside, but also because such variables can be mutated else where, outside of the present code block. The poor programmer must stay alert all the time: "did `this.foo` change since this code is last run?! Or when it is running?"

On the other hand, the same function but implemented differently, this time only with expressions - note the lack of mutation.

```
fun goodMorning(weather, time) {
    val isAm = time.AmPm == 'Am'
    val isSunny = weather.code == 'Sunny'

    return (isAm and isSunny)
}
``` 

Is represented as this.

![expressions](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/expression-based-flow.png)

An expression based function translates to a nice, one-directional diagram. Why one-directional? It's because,
* values cannot be mutated, so there is no need for arrows to go backwards
* a values is either used to build up more values, or returned at the end
* a value can always be rebuilt to the same result, as its parts are also values or expressions (that never change!
* this also applies to global values

These are incredibly powerful assurances to have, and it greatly reduces the mental burden. This is what straight-**FORWARD** code really looks like - you may say statement-based programs can be simple, clear, but remember, they are BACKWARDS in the literal sense.

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

This is simple enough, and it's illustrated as below.

![loop](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/loop.png)

Changes of `p` (the index), combined with the current `state`, leads to changes to `state` itself. 

This looks harmless enough at first sight, until we ask the question, what was the value of `state` in the second iteration?

Sure we can add code such as `if (p == 1) then log(state)`, or introduce more code to keep the audit trail; the point is, without special care, past `state` disappears (like tears in the rain - sorry I couldn't help it).

For coding with immutability, loops are usually the first serious test. The answer is recursion, one form of it is as below,

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

And this is illustrated as,

![loop](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/recursion.png)

Here `P` stands for the parameters to the `sum` function, in this case, both `numbers` and `state`. What's happening here with this snail shell or stair-well?

* A state is never mutated, it leads to a new state
* an old state can be chucked away, or better yet, kept around. Thanks for lack of mutation, it's perfect for auditing

A simple idea! But not to be underestimated. It is behind some of the most powerful architecture styles or frameworks out there. 

The sharp-eyed reader will recognise the similarity to other fancy diagrams in the wild, buzzwords and phrases such as Reactive, Redux, event-driven, event-sourcing, one-directional data-flow, time-traveling. One directional - does that remind you of expressions? And hello, Reducers!

## Exceptions vs Unions

Previously we compared [error handling with values and expressions](/go-lang-error-handling).

Exception based error handling allows us to present very neat code.

```
fun calcDiscount(memberId) -> DiscountRate {
    member = readMember(memberId)
    purchases = findPurchases(memberId)
    discountRate = calcDiscountRate(member, purchases)

    return discountRate
}

```

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/exception-error-handling-naive.png)

But this is at best an illusion, because as we all know - each of these innocent looking function can throw exceptions and blow up the whole application.

![expression facts](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/exception-error-handling-fact.png)

These questions are never really answered satisfyingly (noble effort Java)

* Which code could throw? This is usually not answered with types (if ever tried in Java, it's circumvented), but with documentation, or worse, reading source code.
* which exception has already been caught and handled?

As exceptions usually carry arbitrary payload, in a way, they actually account for arbitrary return types for any code. It's dynamic typing! A loop-hole in many so called "strongly-typed" languages.

On the contrary, value based error handling, especially with union types, brings much sanity and beauty.

```
fun calcDiscount(memberId) -> DiscountRate | Error {
    return readMember(memberId).and_then(
        member -> findPurchases(memberId).and_then(
            purchases -> calcDiscountRate(member, purchases)
        )
    )
}
```

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/union-error-handling.png)

* An error case demands immediate attention as it's the case with pattern matching on Union types
* An clear "error path" runs in parallel to the happy path

Clearly, this is not nearly as smart as exception-based error handling, and requires much less magic. It can be more verbose in simpler languages (as is the case with Go), but when supported with better facilities (as in Rust, F#, Elm and Haskell), it assures us,

* no unexpected long jumps will take place
* clear knowledge and control of error/happy path

Such assurances scales incredibly well with lines of code and aggregation of complexity.

## Inheritance vs Union

Previously we discussed one big difference between [designing with inheritance and Unions](/dont-close-what-is-open). 

* an inheritance graph is meant to be **OPEN**, as it's always possible to add more implementations to an interface, and that shouldn't require changing existing code
* an union type is **CLOSED**; if a new constructor is added to a union, existing code should break as existing pattern matchings are now not exhaustive. (therefore, use of wildcards should be considered an anti-pattern)

An inheritance based design can be illustrated as below,

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/branch-with-classes.png)

Consider the popular "Strategy" design pattern. The idea is to branch as early as possible to choose the applicable "Strategy", after that, following code path should not care which implementation has been chosen; it's an anti-pattern to peek the type of the chosen strategy to introduce ad-hoc logic, such as 

```
if (chosen_strategy.getType() == typeof(PremiumCustomerStrategy)) {
    discountRate = MAX_DISCOUNT
} else {
    discountRate = NORMAL_DISCOUNT
}
```

When a new implementation is added, a new branch appears, which shouldn't interfere with existing branches, nor should it require changes to existing implementations; this is the beauty of well thought-out object-oriented design.

The story is quite different with Unions. With the assurance of a union type being closed and the exhaustiveness that follows, we are empowered to embrace branching.

![expression naive](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/geometrical-beauty/branch-with-union.png)

This will look more verbose than the inheritance-based diagram at first sight, but it affords much benefits,

* there is no pressure to branch early and once for all
* it enables safe composition with code paths and other unions; for example, pattern matching on two union values are trivial
    ```
    match (result1, result2) {
        (Err err1, Err err2) -> ...
        (Ok  res1, Err err2) -> ...
        ...
    }
    ```

You would have called out this is what enables value-based error handling - something that can be quite a handful to design upfront without union types!

## In closing

I hope the simple diagrams in this post help bring clarity to choices made in day-to-day programming, and such choices can result in different levels of conceptual simplicity/complexity, or even geometrical beauty.

It's a misconception that we only need to call for simplicity only required when things get complex, this is not the case! Simplicity scales truly if it's respected from the get-go; as complexity aggregates, so should our assurance of correctness.
