_a.k.a. on the foolishness of spec-driven AI coding_

Would you fly on a plane with software fully and autonomously written by AI?

Or, if you are about to say "yes", let me ask differently, would any airlines be foolish enough to buy and fly such aircraft?

Now you say: don't be dramatic, we don't make flight-control software, it's not a matter of life and death. Sure thing. But it's always a matter of _something_, so what's at stake?

How about hospitals and doctors using machines to operate on patients? A trading platform that deals with millions or billions of dollars on a daily basis? A banking system?

Let's lower the stakes. How about an accounting software for post offices? How about a password manager? Or even lower, a harmless CDN?

Now you say: wait a minute, that's not fair! None of these insinuated issues were caused by AI! But you see, if AI coding is pushed too far, which seems to be the case soon for spec-driven autonomous AI driven, with humans sidelined or out of the loop, there is a guarantee of explosion in incidents, some worse than [loss of a bit of user data](https://paddo.dev/blog/kiro-escalation/).

And it's not even hard to figure out why.

## The rise of mediocrity

Up to this point, the way software engineering works, at least in the mainstream, is empirical and labour-intensive: engineers, let's be gracious to say the _very good_ ones, try their best to build something, up to the point they feel _pretty good_ about it, but here is the catch: very rarely are they 100% sure that the code will work flawlessly. They deploy the change, and sure enough, it will occasionally fail; so the engineers make more changes to patch things up, until the errors stop appearing.

At this point, you'd expect the engineers (note I stressed "very good ones") conclude that the software is fully correct. No way! That would be silly! It takes either full ignorance or arrogance to make such a claim. Instead, an experienced engineer will use words such as "stable", "reliable" or more colourfully, "hardened". There will _always_ be failures!

This inability to produce correct programs, would be fairly disappointing for anyone who puts any level of faith in software engineering, but is well understood and almost taken for granted by the professionals, to an extent that is accepted as iron-clad norm. In fact, many of them may even consider any demand of correctness as offensive, claiming software engineering is not, and never will be mathematics.

This should be stressed not only as a point of reflection, but a necessary reason for the mediocre quality of code out there in the world that any LLM would have used as training data. By the nature of distribution and probability, any generated code, especially in non-trivial volume, is necessarily bog average (let's be kind - up to the quality of the prompt and local context).

This would have been clear to any sober minds, but it's worth calling out so we can now reason with the consequences.

## The simple math of failures

Maybe with some level of schadenfreude, we can foresee (well, already seeing) plenty of people blaming any software incidents on agentic coding tools. An example is the recent AWS outage and Kiro, its internal agentic coding tool (while AWS asserts it's a "user error").

Yet there is a different angle to this - what if the agents have actually been doing a decent job? Let's be graceful again and say that the output has been 10x of the previous volume, and with pretty impressive quality that may just be _slightly under par_ to the labour-intensive output of 10x of humans (that we have also assumed to be top-draw). So far so good, everyone should be happy.

However, the point that people seem to conveniently leave out of the equation is error rate (that is relative) and volume of incidents (an absolute value). Let's say prior to the 10x productivity gain, a software team produces and handles one incident per month; by simple math, with about the same quality and error rate, the same team should now expect to handle 10 incidents!

In case you aren't aware, the cost of incidents is multi-fold: user experience, monetary, reputation, trust; but let's address the simplest aspect - productivity. For a run-of-the-mill, note-worthy once-in-a-month incident, it's not unusual to require the attention of a dozen engineers for the better part of day; for worse ones, let's say once-in-a-quarter, a few dozens of engineers for a week. A once-in-a-year incident (which becomes 10 times a year, mind you) may demand continued involvement of hundreds of engineers over multiple weeks.

Terrified? Explanatory? And no one should _really_ be surprised! The coding agents do not change the equation, and remember, we have been very gracious with our assumptions. In reality, not all teams have top-draw engineers, and not all agent code produce top-draw output, so it's reasonable that many unlucky teams will be staring at the barrel of an explosion of incidents.

## "But it works, and there are _tests_!"

When challenged on the correctness of agentic code, many enthusiasts reach to a righteous retort: it works! Pressed harder, the answer is usually - there are tests! Which, of course, are also generated by agents.

Unfortunately, the same enthusiasts usually share the misunderstanding of correctness, which is believed to be about pure aesthetics, design pattern, use of interfaces, or endless head-spinning "abstraction". Their use of types mostly stop at integers, booleans, classes, interfaces, inheritance peppered with `UnimplementedException`, overloaded functions with plenty of nullables (if supported by the language); they may scoff at literal types, union types as unnecessary and any mention of laws immediately triggers a derogatory ["fancy"](https://github.com/promises-aplus/promises-spec/issues/94); they are likely not aware that Math is being formalised in Lean, or some flight-control systems have been formally verified. Instead, they are likely to hold the firm belief that how code is written in Java, Python or "insert any mainstream language" has been the peak of programming, and should be how software should be built till the end of time.

As to treating "tests" as the end game of correctness, typically they are either unaware of, or do not fully comprehend Dijkstra's well-known statement from ["The Humble Programmer
"](https://www.cs.utexas.edu/~EWD/transcriptions/EWD03xx/EWD340.html),

> program testing can be a very effective way to show the presence of bugs, but is hopelessly inadequate for showing their absence. The only effective way to raise the confidence level of a program significantly is to give a convincing proof of its correctness.

The argument is dead simple: even a simple `Double.average()` function has too many input to be exhaustively tested within reasonable time, so any test must be selective with its input and expected output to find "bugs" - such as the dreaded number overflow, even if each element is within range. Testing is therefore at best a bug-reduction method, not a bug prevention method.

A rigorous implementation may guard against overflow inductively, and communicate failure clearly such as by returning `Double?` or an error, instead of silently returning sentinel values such as `Infinity`, or wrapped values that is a form of corrupt data. 

Needless to say, in complex real-life applications, gaps in correctness are larger, more expensive, and time-consuming to address. Hoping that agents steeped in mediocrity to magically fix any correctness issues is wishful (if not delusional) at best. This is the intrinsic problem of spec-driven (or test-driven for that case) development: regardless of the quality of the specs, the generated code and tests are by probability bog average, and unlikely to be correct.

## Specs compiled to existing languages

A seemingly more plausible trope of thoughts is that coding agents will be able to "compile" natural language specs into Java or Python, which becomes the new "assembly language" of programming, whereas the specs become the new high-level programming language.

It's important to differentiate the said natural language "specs" against the formal specifications such as in [TLA+](https://learntla.com/core/pluscal.html). The latter, being precise and formal, would of course be too nerdy, therefore counter-productive to the cause of hyping up agentic coding.

This trope is flawed on multiple, if not all levels.

First, natural languages are tedious, imprecise, and terrible for expressing anything of non-trivial complexity. This is best put by Dijkstra in this [On the foolishness of "natural language programming"](https://www.cs.utexas.edu/~EWD/transcriptions/EWD06xx/EWD667.html) that should really be required reading by any software engineer at this point of time.

> ... it was argued, by letting the machine carry a larger share of the burden, life would become easier for us. It sounds sensible provided you blame the obligation to use a formal symbolism as the source of your difficulties. But is the argument valid? I doubt.
> A short look at the history of mathematics shows how justified this challenge is. Greek mathematics got stuck because it remained a verbal, pictorial activity, Moslem "algebra", after a timid attempt at symbolism, died when it returned to the rhetoric style, and the modern civilized world could only emerge —for better or for worse— when Western Europe could free itself from the fetters of medieval scholasticism —a vain attempt at verbal precision!— thanks to the carefully, or at least consciously designed formal symbolisms that we owe to people like Vieta, Descartes, Leibniz, and (later) Boole.

The hyped argument that complex software could be built from imprecise specs, with agents magically making up the missing pieces, should not pass the eye test of any sane technologist with adequate literacy. Anyone contending that using natural language is a for programming is either ignorant or dishonest. It would be giant step backwards if this agenda is pushed forward.

Secondly, the natural-language specs enthusiasts may contend that it's possible to write precise specs in a standardised way. As an example, let's look at part of the SPEC.md of OpenAI's demo project [Symphony](https://github.com/openai/symphony/blob/main/SPEC.md#85-active-run-reconciliation),

> For each running issue:
> If tracker state is terminal: terminate worker and clean workspace.
> If tracker state is still active: update the in-memory issue snapshot.
> If tracker state is neither active nor terminal: terminate worker without workspace cleanup.

What does that remind you of? A loop with if / else statements, and references to other components by words. This may make some newly anointed "technologist" ultra excited, but should put a programmer with any level of experience on high alarm: with moderate increase in complexity, this word salad will quickly turn into a hot mess, infested with the most tedious conditionals, wildly uncontrolled cross-references with half-hearted attempt at any coherence let alone precision.

To the rescue, it's foreseeable that the specs enthusiasts may dream up excellent specs tooling (equally agentic and mediocre): checking undefined components; clicking to jump to a definition; parsing the syntax tree to find inconsistencies. Or why not, build a specs language server. Except, betraying the original promises, the supposed "natural" language now morphs into a turing complete programming language, just a ugly, leaky and disgusting one that saps the energy out of even the most zealous supporters.

Thirdly, this trope shows ignorance of the rigour required to make any passably decent compiler. At a minimum, the requirement of strict semantics preservation is already at odds with the probability-based nature of coding agents; there is no viable answer to how optimisation, type checking, error-reporting and debugging through intermediary languages could be implemented when the source language is a _natural language_! Obviously, the hope is most people don't have a clue what the word "compile" means, so why not massage more meaning into it to bear more load? After all, the agents will take of them all!

Lastly, if the agents do have super power to read minds and turn wishy-washy natural language into deterministic output, then what's the point of compiling to Java or Python? Why not compile directly to machine code for mad performance gain, it's such low-hanging fruit! But of course, there is not enough training data for this direct compilation, so we must settle for the golden mediocrity with code in the intermediary language that nobody reads.

## Just another agent, and the steady decline

The go-to answer of the spec-driven enthusiasts, when challenged with another difficult question, is "just add another agent", from architecture, to design, code review, operations, debugging, or indeed, incident resolution or disaster recovery (good luck there).

However, the cooler heads should see through such unfalsifiable claims as pure charlatanry. Layers over layers of slapped-together mediocre Java and Python that enthusiasts contend "just works", is nothing more than the age-old "hope is the strategy". A bit of literacy helps to drive the point home, this time from the great Tony Hoare,

> There are two ways of constructing a software design: One way is to make it so simple that there are obviously no deficiencies, and the other way is to make it so complicated that there are no obvious deficiencies.

It's also a certainty that the world, at least a sizeable portion of it, needs to run on demonstrably, verifiable correct software. The sheer pursuit of quantity without addressing correctness, or at least making significantly improvements therein, is a dead-end. In this sense, any established software products bent on adopting spec-driven development in panic, is more likely to die out of grave quality degradation and bankruptcy of trust, than slowness in delivering the next killer feature.

However, if spec-driven coding does take over, it's easy to see this dystopic future: with the proliferation of mediocre code, which is used as training data for the next iteration, or indeed regurgitation, the quality of software will be on the course of a slow, steady and almost irreversible decline. Eventually, non-agentic, "prehistoric" code will account for a negligibly small percentage, any flaws in software will be incestuously perpetuated. A sad prospect indeed.

## So my job is safe?

Great! So my job as a software engineer is safe and comfy from any disturbance? I am afraid not. 

Spec-driven agentic coding is a dead-end because it's steeped in mediocrity, but this is a case in extreme, and does not defeat the discreet, human-guided use of AI for coding in general. There is no denying the productivity gain from being able to search code and solutions by semantics, and to offload repetitive, mechanical changes (beyond the simple find-replace) that would have been too daunting to even think of, etc etc. The taking-away of such mechanical parts can be disturbingly revealing: what counts now is not speed in persisting and extending the status quo, but understanding, abstraction, rigour, and judgement that stands the scale of productivity.

The rise of mediocrity also means the floor is raised - any codebases, engineers or teams that fall below this line may be exposed and found to be inadequate or lost. In addition, any solution or technology featuring low complexity (e.g. "I write yaml / html all day long") and therefore small search space, is low-hanging fruit for coding agents. Sadly, by sheer distribution of probability, the percentage is not negligible.

To add more uncertainty to the prospect, software engineering as a profession does not have any respectable reputation of doing the right thing. Consider object-oriented programming, SOAP, NoSql, microservices, serverless, the countless front-end frameworks and workflow engineers, the latest frenzies of durable functions. It's foreseeable that a percentage of executives will feel compelled to follow the hype and make a big move in fear of "falling behind". Oh well, you know this has already been happening.

On the positive note, any short-term disturbances aside, quality should prevail. Correctness, reliability and trust will be the differentiating properties of any successful software. Software engineers need to switch to new vocabulary, languages, mindset and culture to prepare for this eventuality.