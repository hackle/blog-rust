Something is missing from most of the "readability" discussions.

You would agree with me that the below example in Python (a),

```Python
[ x * x for xs in [range(1,5), range(6,10)] for x in xs if x % 2 == 0 ]
```

is not as not readable as the same code but better formatted (b),

```Python
[ 
    x * x
    for xs in [range(1,5), range(6,10)] 
    for x in xs 
    if x % 2 == 0 
]
```

When written in JavaScript, for the lack of comprehension (c),

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

For those who prefer the above code, this expression (e) in `Haskell` to the same effect may irk them to the point of yelling "unreadable!" (not W.R.T. the inclusive ranges)

```Haskell
filter even $ foldl (++) [] [[1..4], [6..9]]
```

With cleaner formatting, code (b) almost objectively improves readability over (a); there would be heated discussions about readability for or against the other styles, which would be largely missing the point.

## Stick to the dictionary

Much like "agile", "clean" or "simple", "readability" is one of these meaningless words after much abuse, if not completely undefined in the first place. Most of the time, it's talked about in group discussions, it's usually over-philosophised, broad, vague and too all-encompassing, and like many ambitious terms in software engineering, it quickly smells of subjectivity, opinions and bias, and becomes trigger for cult wars, excuses for closed-mindedness, or subject for bike-shedding.

That's not how I want to talk readability it here.

I would like to stick to the first of many definitions of "read" from [Merriam Webster](https://www.merriam-webster.com/dictionary/read), without expanding and philosophise too much.

> to receive or take in the sense of (letters, symbols, etc.) especially by sight or touch

By this definition, sure and by all means, code should be readable. Being "readable" simply means literally that the sense of lines of code can be taken in easily by fellow programmers, just like text in a book by a reader.

We will avoid expanding from this too much. For example, "readability" of code can be related to, but should not be confused with design patterns, principles or architecture; just like readability of sentences in a book can be related to, but is not the same as the plot, or the morale of the story.

By this definition, it's completely possible that I can read a book, but not understanding it completely; same goes for code: even if every line of code is "readable" to me, I can still miss the big picture completely.

This does not take away the value of readability - it's just not EVERYTHING there is; there are other valuable things that should be talked about specifically and meaningfully, instead of being lumped under the "readability" umbrella. 

## The Author, the Audience and the Vocabulary

As the comparison can be drawn between reading a book and reading code, there are two roles at play: the author and the audience. Not surprisingly, how these two roles are set up or operate, can depend very much on the context.

For instance, when we read code that is known to be good and exemplary. We may struggle to read and understand, but we don't complain about "readability", Why? Because readability is not the issue; the issue is we are not "in the same space" as the author; the author writes code assuming the audience have a workable understanding of the terms and the syntax used.

The key point is, if the author and the audience are not "in the same space", or do not share the same **vocabulary**, then a discussion about "Readability" could be a waste of time. A few examples,

1. The author of a book might write in German, the audience might not understand German
2. The author of code uses linear regression for an algorithm, the audience have no experience with such algorithm, let alone `gradient` and `intercept`.
3. The author uses a functional style, the audience stick to the Object oriented paradigm.
4. The author takes granted using Dependency Injection frameworks; the audience have no exposure to such frameworks, or intentionally avoid them.

How do we manage the **vocabulary** for ourselves as individuals, or for our teams? But maybe first of all, how do we NOT manage it?

## How we should NOT manage the Vocabulary

I want to touch on two "myths" about readability that both seem virtuous beyond any doubt, and should be followed unquestioningly.

My opinions here run the risk of generalisation, which I am happy to take, as these statements may appear aspirational, but are large naive or lacking in nuance, and can be harmful if applied wholesale. 

The flaws of these statements can be made clear if we look at what each means in terms of **vocabulary**.

### Myth 1: code should be readable for anyone - even non-programmers

Another variant of this statement is "code should be readable for five-year-old".

This camp advocates that programs should be written in such a way that any literate person, regardless of roles or specialisation. For example, in a product delivery setting, "anyone" can be product owners, designers, business analysts or test analysts. This is a noble goal, and sounds very inclusive; undoubtedly, it can be achieved occasionally. Like the example below.

```
var drink
if (isMorning) {
    drink = "Coffee"
} else {
    drink = "Tea"
}
```

Is possibly more "readable" for a non-programmer than

```
val drink = isMorning ? "Coffee" : "Tea"
```

As the long form with `if/else` reads just like daily speech. However, many programmers, I included, will prefer the second form for the absence of mutation, and it's more succinct. Does that mean we should take ternary out of our vocabulary, and aim for closeness to natural language as it increases "readability"?

Consider again the bread-n-butter of a Python programmer, list comprehension. `{ x * x for x in range(1,100) if x > 5 }`. This is beauty for a programmer to behold, but may be greek to a non-programmer. Should this be taken out of our vocabulary?

The answer is no, and the reason is simple: natural language is not precise enough.

Let's face it, programming is not easy, we need our own terms to be precise, creative and productive, much like many other disciplines of engineering. Yes, we should strive to use such terms to describe our solution as clearly as possible, but that's still a long cry from using everyday language.

This noble yet naive notion is nothing new - and it was, and still is best countered by the great Dijkstra. [On the foolishness of "natural language programming"](https://www.cs.utexas.edu/users/EWD/transcriptions/EWD06xx/EWD667.html), a short and spicy must-read.

> Instead of regarding the obligation to use formal symbols as a burden, we should regard the convenience of using them as a privilege: thanks to them, school children can learn to do what in earlier days only genius could achieve. (This was evidently not understood by the author that wrote —in 1977— in the preface of a technical report that "even the standard symbols used for logical connectives have been avoided for the sake of clarity". The occurrence of that sentence suggests that the author's misunderstanding is not confined to him alone.) When all is said and told, the "naturalness" with which we use our native tongues boils down to the ease with which we can use them for making statements the nonsense of which is not obvious.

Has any major argument changed significantly since that was written? I don't believe so, or ever will. Not everyone is supposed to read and understand the design of sky-scrapper, nor should the code for any thing adequately complex.

So! There is no shame in using such terms as "lambdas", "high-order functions" or even "monads", because these terms clearly describe things we programmers understand. Your designer doesn't get it? Too bad.

### Myth 2: code should be readable for any junior engineer

A less idealistic statement than the previous one, presumably with an eye on adaptability of codebases, easy onboarding and "transferability" of engineers.

First thing first - this one is terrible as it disregards how one "junior" engineer can be different to another. It's also not very safe to equate being "junior" to having limited knowledge, as a lot of computer-science graduates can be very knowledgeable and up-to-date.

But let's play along and assume we must write code in a way that somebody with basic (mainstream) training in programming should understand. The problem with this statement is the assumption: there is nothing more to learn about expressing ideas with code. Everything should be told from the basic level; there is no more primitives, no more constructs, no more language features or advanced concepts. 

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

Would be much more junior-friendly than the below, for its use of high-order functions and absence of brackets loops.

```Haskell
(odds, evens) = partition odd nums
```

Should we stop our vocabulary at `if/else/for/while/switch/case`, and forever give up using more succinct and more powerful ways of expression? I for one would dread such prospect and consider such prospect depressing. 

OK, maybe we can train the junior programmer up so they get `partition` too, but first, this already breads the rule; and alas, by the time the junior is fully trained, they are possibly no longer junior, and should therefore not have a say. Or, it looks like the only way to have a rich vocabulary is to recruit the brightest juniors. How about 8 years of experience as a requirement?

Sarcasm aside, despite good intentions, this is at best a naive statement that disregards how programming is diverse, complex and ever-evolving; the constant progress, challenge (and beauty) of expressiveness does not stop at the "junior" level, and so should not our vocabulary.


## How we can manage Readability

You would be disappointed that I will not say that we should all embrace dependent types, higher-kinded types, Functors, Applicatives and Monads, and include them in our vocabulary. I am going to act wise, and resort to the cliche, "it depends". On the author, the audience, and most importantly, how they are positioned.

Let's start by looking at a few scenarios.

### 1. the audience set the vocabulary

This can happen to (especially short-term) contractors: there are existing conventions and guides; and as a contractor, one is expected to follow and contribute, not to judge and challenge.

This may sound depressing but it's not - it's the name of the game; it also requires adaptability to be successful. Failing to abide by the existing vocabulary may not be wise, as others may simply reject your code for it. It could also be bad economy depending on how your pay is calculated.

### 2. the author set the vocabulary

You may be in an enviable position to set forth the vocabulary for the audience, for example, as a trainer, a engineering leader, or a opinion or thought leader. Usually, both you and the audience are in for the long game.

It may be tempting to go with your personal preferences and dream goals, but it's always wise to consider and consult your audience: where are they now, and where do they aspire to be? As the **vocabulary** is so fundamental to the expression of ideas, you will want to be strategic, and balance idealism, inspiration, productivity and practicality.

### 3. the vocabulary is negotiable

This will be the position most of us will find ourselves. As the member of a team, we can have a say in the vocabulary. 

In such situations, we possibly want to refrain from saying "unreadable" too much in code reviews to irk our teammates; instead, think if your team is in sync in terms of your vocabulary? Chances you will find disparities; then it's more constructive to have a conversation to sync up and build a common vocabulary.

### 4. the "transferable" programmer

Believe me, being "transferable" is a good thing (very different than being "expendable").

I know it's a bit cliche if not disappointing to say "it depends", and make this seemingly technical topic a social or political one.

But for the case of the "transferable" programmer, I am happy to share my opinions. What if we want to be able to adapt reasonably well across mainstream languages, with a touch of bias towards future-proofing?

Below is a vocabulary that I believe should be commonly accepted and utilised at this point of time for the mainstream programmer; some terms may appear esoteric to some, or common-place to others. That's OK, the point being, I wouldn't yell out "unreadable" at the mere sight of list comprehension, or higher-order functions, even if these are new to me; these are expected of a modern programmer, and I should possibly catch up instead of complain.

So here we go: these items should be included in the vocabulary of a modern programmer, on top the general-purpose turing-complete terms. In no particular order,

- immutability, values and expressions (vs mutation, variables and statements)
- generics, parametric polymorphism
- list comprehension, list functions (vs vanilla loops)
- functions and closures (vs classes, fields, attributes and properties)
- lambdas, higher-order functions (vs delegates, composition only with classes)
- iterators, lazy evaluation (vs optimised loops)
- pattern matching, destructuring (vs field accessors)
- union types (vs inheritance-based simulation)

Use of these terms should not result in decrease in readability alone. Arguing against them in favour of the alternatives (in brackets) can be fun and even satisfying at times; but if we consider the paradigm shift, the progression of programming languages, communities thought trends and idioms, I believe such arguments are for lost causes.