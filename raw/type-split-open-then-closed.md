A typical case for the expression problem is this: with subtyping, it's easier to add new implementations to an interface, but hard to add new operations; with union types, it's easier to add operations, but harder to add new types into the union. It is a tricky problem but not nearly as bad as it's made out ot be. There are ways to mitigate it and it's interesting to look at different solutions from this lens.

# Subtyping

Consider this example in Kotlin,

```Kotlin
interface Animal {
    fun makeSound(): String;
}

class Tiger : Animal {
    override fun makeSound() = "Roar"
}

class Cow : Animal {
    override fun makeSound() = "Moo"
}

fun main(args: Array<String>) {
    val animal: Animal = Tiger()

    println(animal.makeSound())
}
```

Imagine the whole animal kingdom follows the `Animal` interface, and we are asked to add a new method `move()` to all the implementations. We can go straight ahead to add a new method into the interface, but the cost can be quite high as we need to backfill all the implementations; furthermore, what if the `Animal` interface is not in our control? It's from an external codebase shared by many other equally enthusiastic and potential hostile engineers who hate to have their code broken upon a library upgrade?

This is where extension methods come in handy. This is how we go about: we add this method to the interface. Kotlin makes this a piece of cake.

```Kotlin
fun Animal.move() = "Moving"

println(animal.move())
```

Lovely, this is how Kotlin tries to solve the expression problem: a new operation is added to a hierarchy created with subtyping. Bravo!

But this is naive at best as customers will certainly grimace at this, and demand more nuanced movement. So here we go again and try to override `move()` on tiger,

```Kotlin
class Tiger : Animal {
  override fun makeSound() = "Roar"
  override fun move() = "Steals"
}
```

But this won't work for error `error: 'move' overrides nothing`. `override` can only work on functions declared on the original interface, not on an extension function.