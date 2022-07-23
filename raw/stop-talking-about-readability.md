Much like "agile", "clean" or "simple", "readability" is one of these meaningless words after much abuse, if not completely undefined in the first place. Most of the time, it's talked about in group discussions, it's usually over-philosophised, broad, vague and too all-encompassing, and like many ambitious terms in software engineering, it quickly smells of being subjective, and becomes triggers for cult wars. That's not how I want to talk about it here.

It's only practical if we can stick to the first of many definitions of "read" from [Merriam Webster](https://www.merriam-webster.com/dictionary/read), without expanding and philosophise too much.

> to receive or take in the sense of (letters, symbols, etc.) especially by sight or touch

By this definition, sure and by all means, code should be readable. Being "readable" simply means literally that the sense of lines of code can be taken in easily by fellow programmers, just like text in a book by a reader.

We will avoid expanding from this too much. For example, "readability" of code can be related to, but should not be confused with design patterns, principles or architecture; just like readability of sentences in a book can be related to, but is not the same as the plot, or the morale of the story.

By this definition, it's completely possible that I can read a book, but not understanding it completely; same goes for code: even if every line of code is "readable" to me, I can still miss the big picture completely.

This does not take away the value of readability - it's just not EVERYTHING there is; there are other valuable things that should be talked about specifically and meaningfully, instead of being lumped under the "readability" umbrella. 

With that out of the way, I will first share my thoughts on some of the "readability" myths; then, how readability can, and should be managed in a clearly defined context and environment.


## Paradigms

Those who live and breathe Object-Oriented Programming may yell "unreadable code" at the sight of top-level functions, and quickly turn an eye at such "procedural" code.

This sentiment is reciprocated those who identified themselves as Functional Programmers. As soon as "class" come into sight, much repulsion is vented

## Convention and idiom

This can seem quite silly, but I have seen a Java-turned-C# programmer who just could not deal with starting curly braces on a new line, and claimed it annoyed them so much, they could not go on reading the code.

Granted this is a bit extreme, but when we are so sold on a set of rules or conventions, we can find any aversion disconcerting if not distasteful, and that can make it hard to read code, sometimes without knowing. 


This can be tied to "paradigms". For example, someone may hold the strong opinion that "all classes must implement interfaces", and refuse to read any code that fails this criterion.

## Investment and Attachment

More deeply, once we invest so much into specific ways of writing code, it's natural that we want to hold on to and defend such ways; so different styles can easily be construed as intrusive or offensive, our defense mechanism would be triggered, and we instinctively fight back such intrusion.


## Not-so-useful goals

### code should be readable for anybody

This camp advocates that programs should be written in such a way that any literate person, not necessarily at programming, should be able to understand code.

This is a noble goal, and can be achieved occasionally, but I find it largely unhelpful most of the time. Programming can be considered data and algorithm. Every data structure is not plain English, not to mention algorithms. Like many other professions, it's important to use formal terms to express a program accurately. Yes we should strive to describe our solution as clearly as possible, but that's still a long cry from using everyday language - natural language.

This best explained by the great Dijkstra. [On the foolishness of "natural language programming"](https://www.cs.utexas.edu/users/EWD/transcriptions/EWD06xx/EWD667.html).

> Instead of regarding the obligation to use formal symbols as a burden, we should regard the convenience of using them as a privilege: thanks to them, school children can learn to do what in earlier days only genius could achieve. (This was evidently not understood by the author that wrote —in 1977— in the preface of a technical report that "even the standard symbols used for logical connectives have been avoided for the sake of clarity". The occurrence of that sentence suggests that the author's misunderstanding is not confined to him alone.) When all is said and told, the "naturalness" with which we use our native tongues boils down to the ease with which we can use them for making statements the nonsense of which is not obvious.

Has any major argument changed significantly since that was written? I don't believe so, or ever will. Not everyone is supposed to read and understand the design of sky-scrapper, nor should the code for any thing adequately complex.

So! There is no shame in using such terms as "lambdas", "high-order functions" or even "monads", because these terms clearly describe things we programmers understand. Your designer doesn't get it? Too bad.


### code should be readable for a junior engineer

First and utmost, this is a terrible statement that disregards how one "junior" engineer can be different to another. It's not very safe to assume being "junior" means having limited knowledge (beware this is not a safe assumption, as some computer-science graduates can be very knowledgeable and up-to-date). Limited experience maybe, but regarding knowledge, especially the more academic kind - which are becoming very useful in real world programming these days, not just in interviews - can largely depend.

But let's play along and assume we must write code in a way that somebody with basic training in programming should understand; this usually leads to the conclusion that anything more than turning-completeness is not readable.



## Not-so-useful conventions

### magic frameworks

### long jumps

### 



Basically, any measure that makes reasoning with code more difficult. There are some rough measures,

* linear is easier than non-linear
* straight-forward is easier than intertwined
* the less branching, the easier
* self-contained is easier than dependent
* explicit is easier than implicit
* succinct is easier than verbose
* constant is better than ever-changing
* predictable is better than surprises

You would have noticed, some measures may conflict with others, when not applied well. How to find a good balance is where the good minds of a mature engineer comes in.

### 



Language and Vocabulary

Author and Audience

## Useful Measurement

### Aesthetics, Layout and Formatting

### Verbose vs Succinct, Declarative vs Imperative

> The two functors F and G are called naturally isomorphic if there exists a natural transformation from F to G such that ηX is an isomorphism for every object X in C.

Is this readable? Very much. I can read every word (yes, even **functor** :smug face:), and I can read the whole sentence; I understand the logic up to the point that the existence of a "natural transformation" is prerequisite to "natural isomorphism", but alas, I don't understand what this short sentence really means.

And that's a big problem with how people talk about readability today.

IT's not a disguise for closed-mindedness 

Objectively readability

But this has diminishing returns. Sorting imports alphabetically do not necessarily improve readability.

For good economy I would not spend too much time on absolute consistency. Sometimes, it may be OK or even beneficial to have slightly varying code, design or philosophy in a team. 

Everything else is ... subjective.

Chinese - to read newspapers, one need between 2000 to 3000 characters.

I can't read category theory, but it doesn't mean it's not readable.

Key factor to readability, 

## How comfortable are you with a certain way of writing code?

## How familiar are you with the languages, libraries or tools?

## Specialisation


## Vocabulary 
## More meaningful things to discuss

A more meaningful conversation to have with your team, is to define a baseline vocabulary, with which you can then define ways of expression; any argument about language features, conventions or paradigms should now be obviated; instead you can focus on the art of telling a clear story with choice of "words"; this doesn't mean all problems are solved; it's merely a good start to remove bike-shedding, and focus your energy and will power on more useful discussions.


In general, these items should be included in the vocabulary of a modern engineers.

- the basics of any turing-complete, general purpose language
- generics
- list comprehension, or by different names: array functions
- functions and closures
- lambdas, or passing function as parameters (higher-order, first-class, values)
- immutability, expressions, value classes / data classes
    if you see `if then else` should be an expression
- Iterators, lazy evaluation
- pattern matching, destructuring
- union types - depending on the choice of language
- Async / Await, Coroutines
- Reactive programming