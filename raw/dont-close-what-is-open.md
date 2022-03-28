Some design decisions are quite simple. For example: keep it open, or keep it closed.

A routine example: if `Animal` is the base type for `Tiger` and `Cow`, then matching on the subtypes (by type or ad-hoc flags) is a bad idea, especially if it appears repeatedly.

```Kotlin
fun move(animal: Animal) = when (animal) {
  is Tiger -> do something tiger
  is Cow -> do something cow
  ...
}
```

On the other hand, if `Animal` is a union of `Tiger | Cow`, then using the wild card for pattern matching is an equally bad idea,

```F#
match animal with
| Tiger -> something tiger
| _     -> default case 

```

These are both anti-patterns and for the same reason: they **close off** what should be **open**, and **open up** what should be **closed**.

The keywords are not to be confused with that of the famous yet vague principle.

# Subtyping: Types are Open, operations are Closed

The expression problem tells us this: with subtyping, the types are **open**, but the operations are **closed**.

This may be viewed mostly as a restriction of a choice of design, and there are ways to mitigate it; but that's a limited or somewhat dramatised view.

Let's be more specific: it's easier to add new types to a base type, but harder to add new operations - as all subtypes must be updated it becomes a cross-cutting change. (Once again [this](https://stackoverflow.com/a/22180495/4687081) by [Calmarius](https://stackoverflow.com/users/58805/calmarius) does a perfect job of comparing this to schema design as for databases. Highly recommended.)

Consider this example in Kotlin,

```Kotlin
interface Animal {
    fun makeSound(): String
}

class Tiger : Animal {
    override fun makeSound() = "Roar"
}

class Cow : Animal {
    override fun makeSound() = "Moo"
}

fun act(animal: Animal): String = animal.makeSound()

fun main(args: Array<String>) {
    println(act(Tiger())) // prints "Roar"
}
```

The key observation here is the animal types are **open**, as we can add arbitrary number of subtypes of `Animal`, while it remains unchanged itself; but the operations are **closed** to its subtypes. (This is checked by upcasting an instance of a subtype, say `animal: Tiger` to `animal: Animal`, after that only `makeSound()` is preserved, see how `act` is called).

Being "closed" may sound negative, but I assure you it's not. It's a very strong and desirable quality for a design, because it assures us what is KNOWN for certainty. Certainty is good, if not also rare; we should preserve as much of it as possible.

Using our example, for any subtypes of `Animal`, we should ALWAYS be able to act on the premise that `makeSound` is available and with a fittingly specialised implementation for each subtype, be it `Tiger` or `Cow`. It is nice to be sure of it.

If a new operation is needed, for example `Animal.move()`, we must **open** up and modify the `Animal` interface, which can be hard if the type hierarchy is non-trivial. Or must we?

Not necessarily. There are popular workarounds to this problem. A naive one is to create an independent `move` function, where we match on the type of the subtypes.

```Kotlin
fun move(animal: Animal) = when (animal) {
  is Tiger -> "Complex logic on how a tiger moves"
  is Cow -> "Even more complex logic about cows"
  else -> "..."
}
```

This can appear in other forms, for example, by keeping a flag in the base class to enable `animal.name is "Tiger"`, or even worse (you tell me why) with a method on the base class, `animal.IsTiger()` alongside `animal.IsCow`.

Or one with slightly improved syntax (and syntax only) with an extension function,

```Kotlin
fun Animal.move() = when (this) {
    is Tiger -> "Complex logic on how a tiger moves"
    is Cow -> "Even more complex logic about cows"
    else -> "..."
}
```

These are neat solutions, and would be handy in some scenarios, but they share one major theme in flipping the **open** / **closed** quality of the design. 

Let's look closer. The `move()` method can meaningfully account for `Tiger` and `Cow`, but not any new `Animal`; if a `Dog` type is added, this function must be modified to insert a new `is Dog` clause, or it falls through to the catch-all `else` clause, nice, but not always ideal. (Hello Liskov Substitution Principle). In other words, the `move()` function is **closed** to new subtypes; but this contradicts the original design, which wants to be **open** to new subtypes! 

So the guarantee of the design is lost; we no longer have the guarantee every subtype of `Animal` are given a chance to implement a specialised `move` operation; at least not checked and enforced by the compiler; it's all at the mercy of the programmer - human discipline, the least reliable factor in software engineering (or the universe all together) to keep it up-to-date within the standalone `move` function. This is clearly undesirable by comparison, and is a poor way to future-proof a solution.

You see, it may be fun to open up what's closed, except the same thing cannot be open or closed at the same time (it's not a cheesy motivational example for quantum mechanics I promise).

So what do we do? I offer no novelty here; the way to go is textbook - bite the bullet, update the base type; the compiler or any decent tooling (IDE, linter) for lack of compilation will force us to do the right things, that is back-filling `move` into all subtypes.

Question: what if I only want to add `move` to the cats, `Jaguar`, `Tiger` and `Leopard`? Would it break LSP if it's added to `Animal`?
Answer: yes that would; `move` should then be added to the `Cat` type which is a subtype of `Animal` and base type of the cats. Yes I hear you it's inheritance, as intended, and it's the good kind. If we choose subtyping we will stick with it.

Question: should I not use extension methods at all?
Answer: they are sweet things aren't they! But not where we use it to replace or sabotage an existing design based on subtyping.

# Unions: Operations are Open, Types are Closed

Modeling with Union types don't exactly suffer from the same issues, but issues of a different kind.

Consider this naive payment type,

```Haskell
data Payment = Cash | Credit { holder::String, account::String }

paymentInfo :: Payment -> String
paymentInfo Credit {holder=h, account=acc} = h ++ " paid with credit card"
paymentInfo Cash = "Paid with cash"

main = do
  putStrLn $ paymentInfo Cash
  putStrLn $ paymentInfo (Credit "Hackle" "secret account")
```

The same exercise. The types are **closed**, but operations are **open**. As said above, it's great to know that the types are **closed**, because we can safely assume we know all the payment types, Haskell [can help us make sure of it](https://stackoverflow.com/a/31866408/4687081). 

What could possibly go wrong? Ah, ever so easy.

```Haskell
paymentInfo :: Payment -> String
paymentInfo Credit {holder=h, account=acc} = h ++ " paid with credit card"
paymentInfo _ = "Paid with cash"
```

This is bad because if we add a `Coupon` type into `data Payment = Cash | Credit { holder::String, account::String } | Coupon`, calling `paymentInfo(Coupon)` will return `"Paid with cash"`.

In other words, `paymentInfo` is **open** to new types (let's not say "subtypes") of `Payment`, but really we want it to be **closed**! We want to be forced by Haskell to open up this function and modify it. We want the process to be,

* to add `Coupon` to `Payment`,  we must pry open the `Payment` type which is normally closed; 
* this sets off alarms in all use sites of `Payment` as something unusual happens: someone **opened** up this **closed** thing!
* (the closed version of) `paymentInfo`, along with any operations on `Payment` now need also be pried open to allow us to insert handling for `Coupon`;
* when all operations are updated, Haskell is happy, quiet is restored.

# Summary

It's a rather plain message: stick through with a design once it's made, don't self-sabotage by **opening up** what's **closed**, or **close off** what's **open**; although modern languages provide features to do so, and X-language "experts" will make such features and practices look cutting-edge and cool.

A bitter lesson for functional zealots who try to simulate pattern matching with a subtyping - stop trying! it will never work as well as union types. It's fools' gold.