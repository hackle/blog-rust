## The disingenuous compiler experts

Some people claim that coding agents should be treated as compilers: they accept natural language and spit out code. Other people do not agree, arguing that compilers should be deterministic. Then come _some_ people with experience in making compilers, countering that compilers are actually _not_ deterministic, such as just-in-time (JIT) compilation with the JVM, therefore, swinging the conversation in favour of coding agents as compilers.

These experts are being disingenuous. Even with JIT in consideration, compilers are made and trusted to fully preserve the semantics of the source code. Coding agents must infer the intent of human input in natural language, filling in the gaps when context is lacking (and usually doing an amazing job), but they can't be deterministic because it's nearly impossible to _always_ express complexity precisely in natural language to the level of precision of modern programming languages, especially the very good ones.

At least we can hear from proper language designers such as Martin Odersky, having no need to make attention-seeking sensationalistic comments, calls coding agents "flaky compilers" in this recent talk [The End of Programming?](https://www.youtube.com/watch?v=jlJyuJhDnlc) A much more acceptable phrase.

## Leave the mathematicians alone

While building harness can go a long way towards improving the output from coding agents, any attempt to comprehensively document methods to produce sound software under complexity will reach a point of diminishing return (that is far from perfection), and feel like herding cats (and a lot of them). I feel this is a variant of the halting problem.

The smart ones turn their attention to verification. OpenAI threw hundreds of math papers out, some with millions of lines of Lean code. Were they hoping the devastated mathematicians would then scramble to review the code for free? Just when I thought I've seen the worst AI slop PRs!

Terrence Tao spoke up with [A Severe Misalignment of AI in Mathematics](https://terrytao.wordpress.com/2026/09/11/a-severe-misalignment-of-ai-in-mathematics/). Some programmers were not impressed, criticising him for being anti-AI, and losing his plot when his prestige is threatened. The sheer stupidity! This is arguably the best living mathematician they are talking about. To a much lesser extent, it reminds of someone challenging the ideas shared by Simon Peyton Jones (one of the main designers of Haskell), citing SPJ would not understand the complexity of real-life applications, such as dependency injection in Spring. Haha.

While the mainstream programming languages stand no chance of reaching its level of rigour, Lean and its likes stand a genuine chance of being the future of programming. If they do become mainstream thanks to AI, it would be world-changing. For any programmers that takes joy from slighting the mathematicians, remember most programmers won't have the slightest idea on how to to write a Lean statement to start with.

However, I am willing to bet 50 cents on the emergence of gateway-drug languages or language features, that support formal specifications in ways similar to Dafny or Liquid Haskell. The spec language would be familiar enough to not be as intimidating as Lean, Agda or Idris; compiler-checked, opt-in, gradual adoption like that of TypeScript, which may even be a candidate language.

## The inadequacy of testing, let alone TDD

Programmers have their own warm and fuzzy version of verification, testing, or even Test-Driven-Development (or Design, alas). Code coverage is being brought up left and right as the go-to method to ensure correctness. How backwards, almost pathetic.

Dijkstra used this example to show the ineffectiveness of testing: even for a simple operation as multiplication, it's impossible to write [exhaustive tests](https://www.cs.utexas.edu/~EWD/transcriptions/EWD02xx/EWD249/EWD249.html?utm_source=chatgpt.com). 

But modern programming offers different, and arguably better answers. Using a dynamically language, we must use testing to ensure any data is in expected shape at runtime; in a statically typed language, we never bother testing that an `Int` can be assigned a `String` by mistake. Similarly, instead of repeatedly checking that an `List<T>` is not empty, using `NonEmptyList<T>` rejects any bad values from being constructed. This is the catch: we _cannot_ write a test (at least not a normal one, considering compiler tests) to use an empty list when a `NonEmptyList<T>` is expected. The path of execution simply doesn't event exist.

While testing remains important, it can be a fool's errand if we do not look at more effective methods such as rich and expressive types. Heh! Languages like Lean, Agda and Idris are actually based on types, just very powerful ones, under the dependent type theory.

## Who needs design?

It's utterly believable that many people and teams find coding agents produce code in higher quality than their past selves, because the average human quality was nothing to brag about anyway!

Because many people describe intent and instruct agents to write code, it's also believable that they are not writing code by hands. However, code still remains the main artefact (not the executable or the binary, mind you), so it's quite a leap, and a dangerous one, to conclude there is no need at all to review code. The agents are flaky compilers at best!

So what do we look at? As always, the design, of course!

While the coding agents are definitely super-human at being comprehensive and eager to please, they are average at being clear, simple and sound, especially with mainstream languages. Piling on more and more Java or Python code and wishing it doesn't breaks spectacularly, is misguided, speaking charitably. It takes top harness, quality context, expert prompting and sharp review to ensure the right ideas are implemented in the right ways.

There are those who give up to the slop, don't review any code, and YOLO when it lasts. For those who still build software with care, the differentiator is more than ever the quality of thoughts; design is not outdated, it is all we need, and all we have. Even if Lean takes over.