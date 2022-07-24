More often than not, discussions about "readability" miss the point.

You would agree with me that the below example in Python (a),

```Python
[ x * x for xs in [range(1,5), range(6,10)] for x in xs if x % 2 == 0 ]
```

is not as readable as the same code but better formatted (b),

```Python
[ 
    x * x
    for xs in [range(1,5), range(6,10)] 
    for x in xs 
    if x % 2 == 0 
]
```

When written in JavaScript, for the lack of comprehension (c), the argument could go either way,

```JavaScript
// given a naive `range`
const range = (x,y) => new Array(y - x).fill(0).map((_, idx) => x + idx); 

[range(1,5), range(6,10)]
    .flatMap(x => x)
    .filter(x => x % 2 == 0)
    .map(x => x * x)
```

But I wouldn't be surprised if people contend passionately the above is MUCH worse in readability than nested loops (d).

```JavaScript
let result = [];
for (let xs of [range(1,5), range(6, 10)]) {
    for (let x of xs) {
        if (x % 2 == 0) {
            result.push(x);
        }
    }
}
```

For those who prefer the above code, this expression (e) in `Haskell` to the same effect may also irk them a little (not just W.R.T. the inclusive ranges)

```Haskell
filter even $ foldl (++) [] [[1..4], [6..9]]
```

With cleaner formatting, code (b) almost objectively improves readability over (a); there would be a number of arguments for or against any of (b, c, d, e), such discussions would largely miss the point.

## Stick to the dictionary

Much like "agile", "clean" or "simple", "readability" has become one of these meaningless words. Most of the time, it's talked about in over-philosophised, broad, vague and all-encompassing ways. Like many ambitious terms in software engineering, it smells strongly of subjectivity, opinions and bias, and degenerates to trigger for cult wars, excuse for closed-mindedness, or subject for bike-shedding.

Holding "readable code" as the holy grail is not wrong. If we generalise "readability", then any number of factors can lead to more or less readable code; one can argue good architecture, design and implementation all result in high scores in readability. However, such generalisation is not much different than saying "life is like a box of chocolate", or "life is like a river", it's not wrong, but not very helpful either.

That's not how I want to talk readability it here.

I would like to stick to the first of many definitions of "read" from [Merriam Webster](https://www.merriam-webster.com/dictionary/read), without expanding and philosophise too much.

> transitive verb
> to receive or take in the sense of (letters, symbols, etc.) especially by sight or touch

By this definition, sure and by all means, code should be readable. Being "readable" simply and specifically means that the sense of code can be taken in easily by fellow programmers, just like text in a book by a reader.

We will avoid expanding too much. For example, "readability" of code can be related to, but should not be confused with design patterns, principles or architecture; just like readability of sentences in a book can be related to, but is not the same as the plot, or the morale of the story.

By this definition, it's completely possible that I can read each sentence, but not understand a book completely; same goes for code: even if every line of code is "readable" to me, I may still miss the big picture of the program. This does not take away from readability - it's just not ALL there is to programming; there are many other valuable things that should be talked about separately, specifically and meaningfully, instead of lumped under the "readability" umbrella. 

## The Author, the Audience and the Vocabulary

As the comparison can be drawn between reading a book and reading code, there are two roles at play: the author and the audience. Not surprisingly, there is always context to how these two roles are set up or operate.

For instance, when we read code that is KNOWN to be good and exemplary. We may struggle to read and understand, but we don't complain about "readability", Why? Because readability is not the issue; the issue is we are not "in the same space" as the author; the author writes code assuming the audience have a workable understanding of the terms and the syntax used.

The key point is, if the author and the audience are not "in the same space", or do not share the same **vocabulary**, then a discussion about "readability" could be a waste of time. A few examples,

1. The author of a book might write in German, the audience might not understand German
2. The author of code uses linear regression for an algorithm, the audience have no experience with such algorithm, let alone `gradient` and `intercept`.
3. The author uses a functional style, the audience stick to the Object oriented paradigm.
4. The author takes granted using Dependency Injection frameworks; the audience have no exposure to such frameworks, or intentionally avoid them.

It takes a fair amount of overlap for the author and the audience to be "in the same space": educational background, experience, personal preferences, technological choices etc. Most fundamentally, they must share the same **vocabulary**. For programmers, this could mean *the primitives, building blocks and style of writing code*.

If the author uses a vocabulary with too little overlap with that of the audience, there will definitely be a readability issue.

How do we manage the **vocabulary** as an author, or member of the audience or a team, to minimise friction and maximise readability?

Maybe it's best to look at how we should NOT manage it.

## How we should NOT manage the Vocabulary

I want to touch on two "myths" about readability that both seem so virtuous that one must follow unquestioningly.

My opinions here run the risk of generalisation, which I am happy to take, as these statements may appear aspirational, but are large naive or lacking in nuance, and can be harmful if applied without discretion. 

Fortunately, using the **vocabulary** notion, the flaws of these statements can be exposed pretty easily.

### Myth 1: code should be readable for anyone - even non-programmers

Or, "code should be readable for five-year-old".

This camp advocates that programs should be written for the reading of any literate person, regardless of roles or specialisation. For example, in a product delivery setting, "anyone" can be product owners, designers, business analysts or test analysts. This is a noble goal, and sounds very inclusive; undoubtedly, it can be achieved occasionally, such as the example below.

```
var drink
if (isMorning) {
    drink = "Coffee"
} else {
    drink = "Tea"
}
```

Using `if/else`, this reads just like daily speech, and is possibly much more "readable" for a non-programmer than

```
val drink = isMorning ? "Coffee" : "Tea"
```

However, many programmers, I included, will prefer the second form for the absence of mutation and benefit of immutability, if not also for succinctness. Does that mean we should take ternary out of our vocabulary, and aim for closeness to natural language as it increases "readability" for everyone?

Consider also the bread-n-butter of a Python programmer, list comprehension. `{ x * x for x in range(1,100) if x > 5 }`. This is beauty to behold for a programmer, but may be greek to a non-programmer. Should this be taken out of our vocabulary too?

The answer is NO, and the reason is simple: natural language is not precise enough.

Let's face it, programming is not easy - small mistakes so much as a mis-positioned whitespace can throw our programs off. We need our own terms to be precise, creative and productive, much like many other disciplines of engineering. Yes, we should still strive to use such terms to describe our solution as clearly as possible, but that's a long cry from using everyday language.

This noble yet naive notion is nothing new - and it was (and still is) best countered by the great Dijkstra. [On the foolishness of "natural language programming"](https://www.cs.utexas.edu/users/EWD/transcriptions/EWD06xx/EWD667.html), a short and spicy must-read.

> Instead of regarding the obligation to use formal symbols as a burden, we should regard the convenience of using them as a privilege: thanks to them, school children can learn to do what in earlier days only genius could achieve. (This was evidently not understood by the author that wrote —in 1977— in the preface of a technical report that "even the standard symbols used for logical connectives have been avoided for the sake of clarity". The occurrence of that sentence suggests that the author's misunderstanding is not confined to him alone.) When all is said and told, the "naturalness" with which we use our native tongues boils down to the ease with which we can use them for making statements the nonsense of which is not obvious.

Has any major argument changed significantly since that was written? I don't believe so, or ever will. Not everyone is supposed to read and understand the design of sky-scrappers, nor should the code for anything adequately complex.

So! There is no shame in using such terms as "fold", "flat_map" or "bind" in our code, because these terms clearly describe things we as programmers understand. Your designer doesn't get it? Too bad.

### Myth 2: code should be readable for any junior engineer

A less idealistic statement than the previous one, presumably with an eye on adaptability of codebases, easy onboarding and "transferability" of engineers.

First thing first - it is actually quite terrible as it disregards how one "junior" engineer can be different to another. I for one know very well it's not safe to equate being "junior" to having limited knowledge, as a bright computer-science graduate ("junior") can be very knowledgeable and up-to-date.

But let's play along and assume we must write code in a way for someone with basic (mainstream) training in programming. The problem is with the assumption: there is nothing more to learn about expressing ideas with code. The whole vocabulary should have been taught as part of the basics; there is no more primitives, no more constructs, no more language features or advanced concepts to be added.

This usually leads to the conclusion that anything more than turning-completeness is not readable. For example,

```
var odds = []
var evens = []
for (var i = 0; i < nums.length; i++) {
    var current = nums[i]
    if current % 2 == 0
        evens.push(current)
    else
        odds.push(current)
}
```

Would be much more junior-friendly than the below, for its use of high-order functions and absence of brackets and loops.

```Haskell
(odds, evens) = partition odd nums
```

Should we stop our vocabulary at `if/else/for/while/switch/case`, and forever give up using more succinct and more powerful ways of expression? I for one would dread such prospect and consider it depressing. 

OK, maybe we can train the junior up so they get `partition` too. But first, this already breaks the rule; and alas, by the time the junior is fully trained, they are possibly no longer junior, and should therefore not have a say in adding to the vocabulary. 

Alternatively, in order to have a rich vocabulary, we must recruit the brightest and mostly experienced "juniors". How about 8 years of experience as a requirement?

Sarcasm aside, despite good intentions, this is at best a naive statement that disregards how programming is diverse, complex and ever-evolving; the constant progress, challenge (and beauty) of expressiveness does not stop at the "junior" level, and so should not our vocabulary.


## How we can manage Readability

You would be disappointed that I am not going to say that we should all embrace dependent types, higher-kinded types, Functors, Applicatives and Monads as part of our vocabulary. Instea I will act wisely, and resort to the cliche, "it depends" - on the author, the audience, and most importantly, how they are positioned.

This can be analysed with a few scenarios.

### 1. the audience set the vocabulary

This typically happen to (especially short-term) contractors: there are existing conventions and guidelines; and as a contractor, one is expected to follow and contribute, not to judge and challenge.

This may sound depressing but it's not - it's the name of the game; it also takes adaptability (a rare skill) to be successful. Failing to abide by the existing vocabulary may not be wise, as the audience may simply reject your code. It could also be bad economy depending on how your pay is calculated.

### 2. the author sets the vocabulary

You may be in an enviable position to set forth the vocabulary for the audience, for example, as a trainer, a engineering leader, or a opinion- or thought-leader. People looks up to you. Usually, both you and the audience are in for the long game.

It may be tempting to go with your personal preferences, beliefs and the "dream" vocabulary, but it's often wise to consider and consult your audience: where are they now, and where do they aspire to be? As the **vocabulary** is so fundamental to the expression of ideas, you will want to be strategic, and balance idealism, inspiration, productivity and practicality.

### 3. the vocabulary is up for negotiation

This will be the position most of us find ourselves. As the member of a team, we can have a say in what goes into the vocabulary. 

In such situations, we possibly want to refrain from saying "unreadable" too much in code reviews to irk our teammates, as it may appear unspecific, judgemental and counter-productive; instead, think if members of the team share enough overlap in terms of your vocabularies? Chances are, you will find disparities; if so, it's more constructive to have a team discussion to build or sync up the common vocabulary.

### 4. the "transferable" programmer

Believe me, being "transferable" is a good thing (very different than being "expendable").

I know it's a bit cliche if not disappointing to say "it depends" to this seemingly technical topic, to make it social or almost political.

Maybe it's more interesting to discuss "readability" context-free. What should be a commonly accepted vocabulary, if wishful thinking counts?

I am happy to share my opinion, as one of these who wish to be able to adapt reasonably well across mainstream yet different languages, with a touch of bias towards future-proofing.

Below is a vocabulary that I believe should be commonly accepted and utilised at this point of time for the modern mainstream programmer; some terms may appear esoteric to some, or common-place to others. That's OK, the point being, I wouldn't yell out "unreadable" at the mere sight of any items in the list.

So here we go, not including the general-purpose turing-complete basics, in no particular order,

- immutability, values and expressions (vs mutation, variables and statements)
- generics, parametric polymorphism
- list comprehension, list functions (vs vanilla loops)
- functions and closures (vs classes, fields, attributes and properties)
- lambdas, higher-order functions (vs delegates, composition only with classes)
- iterators, lazy evaluation (vs optimised loops)
- pattern matching, destructuring (vs field accessors)
- union types (vs inheritance-based simulation)

I do not believe use of any of the above alone should result in decrease of readability. Arguing against them in favour of the alternatives (in brackets) can be fun and even satisfying at times; but if we consider the paradigm shift, the trends and progression of programming languages, communities, trends and idioms, it's my diagnosis that such arguments can fall prey to bike-shedding, and are not helpful in general.