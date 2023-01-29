A question many C# programmers ask is "why isn't this library providing interfaces for dependency injection?"

Short answer: the libraries shouldn't provide interfaces for D.I. (even if some of them do), and this may not be a very good question to ask. 

Let me take it from the top. 

## Who owns the interface?

One of my repeated embarrassing experiences, is to go to a hardware store for something - let's say a box of screws, and draw a blank face when the staff answers my question with a few of their own: "a box of crews? For timber or Metal? Pine? Hardwood? Outdoors or indoors? What size?"

A foolish customer may say, "You work in the hardware store, you tell me!"

Anyone else with the right mind will need to find the answers for these questions. You see, the answers are the specs, or the interface; as the consumers, we *own* the interface. The hardware store has *implementations*, but they don't own the interface. 

The benefits of having an interface is obvious: I as the consumer am now free to choose any brand of screws from any vendors; the consumers and the manufacturers don't have to know or deal with each other directly. They are "decoupled", it is good business, and pretty liberating!

## You don't always need an interface

An interface is useful when there are different parties involved: that's why it has "inter" in it. Suppose the consumer and the provider are the same person, or there is no need for various implementations, then we may not need specs or interfaces.

For example, if I use bricks to build a wall, specs are essential: bricks are best in the same size. But if a wall is built by fitting rocks of various shapes and sizes together, then specs are unnecessary.

Make no mistake, I can still make an interface for each rock, but it's backwards: firstly, I own the interface and the implementation. Secondly, the interface would be retrofitted from the implementation, and it's unlikely I will "make" another rock to fit the shape of an existing rocks with an irregular shape.

Sometimes this appears virtuous, people will sing praises to me: look at this builder, he creates specs for each rock! How professional, great job!

Most likely this will get me in trouble, because the same people will think: I am never going to hire this builder, such a waste of time and the employer's money!

## Interfaces are not used for integration any more

The analogy translates to software engineering. No surprises as both are logic, and both forms of human interaction.

Popular (but possibly out-dated) literature in software engineering perpetrates this line of thinking that there are ALWAYS multiple parties involved in programming a solution. A typical example is: 1) programmer A writes an interface, and programmer B writes the implementation.  

This is further used as an example of software integration: 2) team A own a service with an interface, and team B (amongst other teams) provide an implementation.

Scenario 1) would have many learners wondering: is this how professional software development works? It sounds like a wonderful system. Well, I hate to break it to you: it's not. And it's a terrible system. Within the same team and the same codebase, the same programmers are both the consumers and the providers - using interfaces in this fashion is made-up at best, and it's not how we integrate components. 

(An `interface` may still be used for other purposes - such as mocking, dependency injectors and unit testing, which is a problem of its own.)

Scenario 2) may be completely outdated - we are in the age of the web, distributed computing and microservices; most software systems are integrated through HTTP and JSON, not another process on the same machine, or binaries behind header files.

An `interface` as a language construct is not used at all. There are still "interfaces" in the broader sense, which appear in the form of JSON schemas that can be validated with tools.

## Packages and libraries

This leaves us packages and libraries. It doesn't take a genius to see, in the age of open-source software, libraries are rarely made to interfaces (in the narrow sense). Sure, there may be conventions or idioms, but there is no central repository of `interface`s for libraries to implement. Logging libraries may share some common design, but they don't share a common interface. So there goes the "interface by programmer A and implementation by programmer B" theory.

What's worse - it's usually the reverse: not many teams are building everything from scratch, why, it's a bit foolhardy when quality open-source libraries are readily available (and for free)! So libraries would be picked first, and the choices would now dictate core application code, not the other way around. Power to the providers! (Well not really, I never believed in *free* OSS as a sustainable solution, and the authors aren't really that powerful.)

So we design a house to the available bricks, that's not so bad, especially if bricks are free. The consumer-provider dynamic changes, but does the necessity of interface?

It seems not - the choice is made, the deal is done, so no need for interfaces right? 

But why are C# programmers crying out for interfaces from library authors? 

Oh, they don't need it as a consumer. they want it for mocking, dependency injection and unit testing!

The rationale goes: 

* "Anything concrete class must be injected through an interface" (or an IoC container)
* `BartLogger` is a concrete class from library
* Therefore it must be injected through an interface
* But there is no interface `IBartLogger` from the library, therefore I cannot inject `BartLogger` to my application (not directly. I'll need to create a wrapper around `BartLogger`)
* Therefore, libraries are at fault for not providing an `IBartLogger`.

Irrefutable reasoning isn't it? Except it's based on some pretty shaky premise: any concrete class must be injected through an interface. 

Libraries are supposed to be lean, composable to be maximally reusable; the authors will not and should not be concerned with users' architecture patterns, of choice of D.I. framework.

This is evident from any core libraries - from `DateTime` to `Linq` to `MemoryStream`. There are still interfaces and good ones, but not "header interfaces" for the purpose of dependency injection?

Even if we take a step back and ignore the distasteful coupling, what's the harm? What if an interface is provided? Let's see,

1) whatever code that depends on the (kindly provided) interface also depends on the implementation, as there is 1:1 mapping
2) whatever project that depends on the interface package also depends on the implementation package, as they are from the same origin

This defeats one of the key purposes of using interfaces: to decouple the consumer from the provider, as the consumer does not own the interface, and is coupled to the provider for both the interface and the implementation. Coupled to an interface! Isn't that ironic?!

## In summary

Interfaces are useful, but not as "header interfaces", or how they are used in the "enterprise" architecture, to facilitate mocking, unit testing or dependency injection. Despite their popularity, such practice is "fool's gold" and should be watched out for vigilantly.
