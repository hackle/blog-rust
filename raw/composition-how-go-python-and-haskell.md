Many are eager to equate "composition" with "has-a relationship" due to classical teaching, but this is a narrow view of composition at best.

Anther form of composition is hidden in plain sight: interface segregation in SOLID naturally leads to composition of *small* interfaces so consumers can be more specific with their requirements.

> the interface segregation principle (ISP) states that no code should be forced to depend on methods it does not use.[1] 

Alas, this is a high bar! It means if we have an interface,

```CSharp
interface ICat 
{
    void Move();
    string Meow();
}

class Foo
{
    string MakeSound(ICat cat)
    {
        return cat.Meow();
    }
}
```

As `MakeSound` does not need `Move` but it's forced to depend on the `ICat` interface, the design violates interface segregation!

It would seem most interfaces should have one method only - which effectively makes them functions. (This [Kotlin documentation](https://kotlinlang.org/docs/fun-interfaces.html) says they are mostly equivalent.) Does this mean most classes should each have one or two method?

As much as I love how this fits the *functional programming* narrative, to be honest, it does not have to be the case. There are ways we can compose interfaces to make 

Of course if you use a dependency injector for your C# project, then your code base will be polluted with 1:1 mapping from interfaces to implementations and have missed out how this valuable design principle. (At least there is less clutter in Java with Springboot.)



## C# implementation

## TypeScript almost got it

## Rust with adhoc polymorphism

## Python Protocol

