Opaque code is much like an opaque person, whose true intentions and feelings cannot be gauged from the appearance.

What must be a valuable quality for a poker player, can make a very annoying driver, one that makes a turn without indicating, or worse, keeps head-lights off when it gets dark.

Many programmers (myself included from time to time) mistake being opaque as being cool (look, my code is magic and only I know how it works!) and forget that programming is more like driving than playing poker.

The opposite quality is transparency - when intentions can be completely and reliably inferred from appearances. Terrible for a poker player, but much desired from code.

Instead of pitching them against each other, maybe it's more helpful to compare code by varying degrees of opacity. This is exactly what we'll do that, by going through a few contributing factors.

## The lower hanging fruits

Let's skip the obvious ones: naming, commenting, documentation. Not because they are not important, but for the ease of reaching diminishing return, or they are more issues of discipline than anything else deep. 

There are also age-old issues with comments and documentation: they easily go out of sync with code and result in confusion - much worse than high opacity!

## "abstraction"

Many people maintain that "good abstractions increase clarity, not decreasing it". The issue is, there aren't that many good abstractions, or the abstractions most of us refer to are not REAL abstractions.

My favourite example was a former colleague, who used the term "wrong abstraction" extensively to criticise his teammates' code. Both curious and intimidated, I took a sneak-peak at his PR review comments, it turned out, by "abstraction" he meant exclusively "proper" use of dependency injectors (IoC containers)!

While in real life it's a virtue to be specific ("Do you have a coffee machine at work?"), some programmers have a tendency to be abstract ("Do you have a beverage provider that provides coffee at work"), under the false pretence the office may one day also build an in-house beer brewery.

One or two workplaces in a million do have their own brewery, the point should stand that being specific should be the default, not being abstract.

This can be a hard pill to swallow for the over-thinkers: what if we switch database vendors overnight? What if we changed Cloud platform tomorrow? Chances are, the precious little interfaces are the last things to stay unchanged.

This is typically a problem with sub-typing: the base type must account for the commonality of all its sub-types. It takes a lot of planning and is very hard to get right! (Well it is possible with more granular, capability-based interfaces, but that's not the mainstream practices, last I heard).

## Indirection, local and global optimum

What's closely related to "abstraction" is indirection. As it's famously said, "All problems in computer science can be solved by another level of indirection" (Butler Lampson).

Unfortunately people take this the wrong way: instead of heeding the warning, they take it as encouragement. Anything must be loose-coupled; anything must be composable with anything else. 

This leads to abysmally opaque architecture such as Redux, with which `1 + 2 = 3` is implemented as,

1. dispatch event `{ Operand1: 1 }`
2. dispatch event `{ Operator: "+" }`
3. dispatch event `{ Operand2: 2 }`
4. a state-of-the-art event processor to unique group the above events without duplication, carries out the calculation, and dispatches event `{ result: 3 }`
5. the client side polls and handles the result `3`. Glory!

But look, each individual step is crystal clear! And so testable too.

Redux does a fantastic job of confusing local optimum with global optimum: what was trivial is made simple and becomes a selling point, but what was complex is now impenetrable.

This can also be taken to architectural heights - hail the nano-services movement, and then hail again the [discovery of non-microservices](https://www.primevideotech.com/video-streaming/scaling-up-the-prime-video-audio-video-monitoring-service-and-reducing-costs-by-90). Why is this even news! The fashionable side of programming.

## Typing

Despite a few attention-seekers, most of us would take it for granted that static type-checking should be the sensible default, and good use of types results in increased transparency.

When types are enforced, implementation is held honest. With honesty comes reliability: types become a reliable channel of communication between the writer and the readers.

Quite excitingly, there are the good movements - adding more expressive power to the type systems, so programmers can express more sophisticated constraints that used to be the realm of runtime checking or unit testing.

Then there is the stray movement much like that of unbridled nano-services: using types for dynamic-type-like programming. Yes, I am referring to the abuse of reflection.

Use of reflection does not always in opaqueness, a good example is serialisation and deserialisation. Transparency arises from high predictability, which is a good thing. The same goes for IoC containers that inject implementations for interfaces based on 1:1 mapping. As long as this line of 1:1 mapping is held, the behaviour is predictable to the point of transparent.

But this simple rule can feel restrictive and less "intellectually" satisfying, and people always ask for more "advanced" features. So when the question is asked, "How do I inject a string or an int?", an answer is readily produced: "yes". Hence the [Spring magic](https://docs.spring.io/spring-framework/docs/3.0.0.M4/reference/html/ch03s04.html#:~:text=3.4.2.1%C2%A0Straight%20values%20(primitives%2C%20Strings%2C%20and%20so%20on)) and its many, many followers.

## In ironical closing

Transparency wins, but opaqueness sells. Let that sink in.





