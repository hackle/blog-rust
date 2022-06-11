Value-based design goes a very long way, and it's unfortunate how easily we get distracted by cheap thrills and easy wins and give up on values too soon. Previously I looked at how value-based error handling is the way of the future as it offers more deterministic results. Sticking to values may sound easy, but it can have pretty far-reaching impact. As it's the case for sticking to correctness than convenience - even in life, but I should refrain from offering life advices :) 

Here is something else that may shock an OO programmer: dependency injectors are not idiomatic or as prevalent as in Java or C#. (Yes I am aware of goodies like [Wire]() which uses code generation, which I believe it's the way forward, see also [Introducing C# Source Generators](https://devblogs.microsoft.com/dotnet/introducing-c-source-generators/)) People find themselves as a loss when faced with a Go application, as dependencies are passed down as parameters. Amateurs! or "poor men's dependency injection", they say, and go on to claim Go is one of the worst languages.

(These might be the same people who also believe that any class should come with an interface, including libraries or frameworks.)

However, passing values down is exactly what values-based design looks like: instead of using some sort of container that magically initialises and injects dependencies.

A language feature of Go is duck-typed interfaces, that solves the age-old problem of interface-segregation, and enables true "composition" over inheritance. Let's expand.

Classical teaching defines interface segregation as,

> the interface segregation principle (ISP) states that no code should be forced to depend on methods it does not use.[1] 

Alas, this rules out most of our interfaces as misfits or bad, or, most interfaces should have one method only - which makes them functions. This [Kotlin documentation](https://kotlinlang.org/docs/fun-interfaces.html) says they are mostly equivalent. 

But this is really, really hard to do, and it especially don't play well with dependency injectors.

So what are we going to do? Chuck that away.
