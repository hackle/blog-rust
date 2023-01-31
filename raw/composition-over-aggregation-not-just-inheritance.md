One thing I love about category theory literature is the line of reasoning through "factorisation".

It goes as, given two similar abstractions, if abstraction B can be defined by extending abstraction A, then A is the "better" abstraction, because B is "factored" by A. In other words, A is a more essential expression of B.

## A class is factored by functions

A trivial examples is functions factor classes, as a class can be expressed as curries functions.

```TypeScript
class LollyFactory {
    constructor(type: string) {...}

    makeLolly(): Lolly {...}
}

// is the same as this curried function
function lollyFactory(type: string) {
    return {
        makeLolly: () => Lolly(...)
    };
}

// these are equivalent
new LollyFactory('toffee').makeLolly();

lollyFactory('toffee').makeLolly();
```

Thus we can say any class can be factored by functions. 

Granted classes may come with syntax sugar such as `this` or `self` that the function form may not be able to take advantage of.

(Note though, this is a conservative statement, as languages can easily overcome some of the obstacle: extension methods in C#, extension functions or Kotlin, or struct implementation in Rust or Go. In fact the `class` keyword is completely gone in Go or Rust, and definitely for the better.)

## Composition is factored by Aggregation

Let's look at another age-old mantra: "composition over inheritance", which roughly says in Object-Oriented Programming, to model complex behaviour, one should prefer composing small classes over extending and bloating out a base class.

The reasoning behind this recommendation has been explained a million times so I am not going to bore you by adding to that. What's less known is this principle can also be "factorised" to a more essential form, which is phrased as "composition over aggregation".

We'll start with the OOP example.

```TypeScript
class Person {
    birthday: Date
}

class AgeCalculator {
    calcAge(p: Person): number {
        // ... calculate age from birthday
    }
}

class GiftRecommender extends AgeCalculator {
    recommendGift(p: Person): Gift {
        const isBigBirthday = super.calcAge(p) % 10 == 0;

        if (isBigBirthday(p)) return Gift.Yacht;   // we wish :)

        // ...
    }
}
```

This is bad - not just because the unnecessary wrapping with classes, or every birthday is as big as others. but, amongst many other thing, `GiftRecommender` adds useful behaviour that's tightly-coupled to the base class `AgeCalculator`. To refactor using "composition", we move the useful behaviour out into its own class, 

```TypeScript
class AgeCalculator {
    calcAge(p: Person): number {
        // ... calculate age from birthday
    }
}

class BigBirthdayCalculator {
    isBigBirthday(age: number): boolean {
        return age % 10 == 0;
    }
}

class GiftRecommender {
    constructor(
        private ageCalc : AgeCalculator,
        private bigBirthdayCalc : BigBirthdayCalculator
    ) {...}

    recommendGift(p: Person): Gift {
        if (this.bigBirthdayCalc.isBigBirthday(this.ageCalc.calcAge(p)))
            return Gift.Yacht;
        // ...
    }
}
```

This way `BigBirthdayCalculator` is not coupled to `AgeCalculator`, and more importantly, we have a flatter dependence hierarchy, plus many, many benefits to follow for the ages to come.

All very good and nice, but classes are so cumbersomeness and noisy! What if we factor out the fat by using functions? The original version becomes.

```TypeScript
function calcAge(p: Person): number {
    // ... calculate age from birthday
}

function recommendGift(p: Person): Gift {
    const isBigBirthday = calcAge(p) % 10 == 0;

    if (isBigBirthday(p)) return Gift.Yacht;

    // ...
}
```

Don't let functions fool you, we still have the same problem: `recommendGift` is built on top of `calcAge` and it encapsulates and hides a useful function `isBigBirthday`.

In another word, this is "aggregation" of behaviour into one inseparable block. 

Now let's refactor it into the composition-based form.

```TypeScript
function isBigBirthday(age: number): boolean {
    return age % 10 == 0;
}

function recommendGift(p: Person): Gift {
    if (isBigBday(calcAge(p)))
        return Gift.Yacht;
    // ...
}
```

Or injecting functions as dependencies if deemed necessary,

```TypeScript
function recommendGift(
    p: Person,
    calcAge: (p: Person) => number,
    bigGiftPred: (age: number) => boolean,
): Gift {
    if (bigGiftPred(calcAge(p)))
        return Gift.Yacht;
    // ...
}

const gift = recommendGift(person, calculateAge, isBigBirthday);
```

But we should stop here - why couple the choice of gifts to age?

```TypeScript
function chooseGift(grade: GiftGrade) = {
    'High': Gift.Yacht,
    'Low': Gift.Card,
}

function recommendGift(
    p: Person
): Gift {
    const giftGrade = isBigBirthday(calcAge(p)) ? 'High' : 'Low';
        
    return chooseGift(giftGrade);
}
```

Now `recommendGift` is a function that composes 3 smaller functions:  `calcAge >> isBigBirthday >> chooseGift`, with a bit of glue code in between. (As a fun exercise, try to rewrite this with classes.)

What's the big deal here? Well, quite a few things to note!

* Composition does not have to be just about classes, function composition is the more essential form
* Composition does not have to be based on injection of dependencies either (although it may be virtuous to do so)
* "Inheritance" is just the class-based form of "Aggregation": the snowballing of more behaviour into a ever-growing block
* "Aggregation" is the real anti-pattern, because it results in deeper dependency, lower level of reusability, and higher level of coupling.

## Wrappers, proxies and add-ons

The beauty of reaching a good abstraction, is the ability to apply the abstraction more broadly. Indeed, "aggregation" appears in other forms on other levels, for example, software components such as packages, libraries or services.

Let's say there is an UI library for language universalisation, `lang-univ` that magically supports translating the base language (let's say English) to many other languages, including "Aurorian" which is used on planet Aurora.

However it does not support "Gaian" which is used on a small planet Gaia. Fortunately, Gaian is a close dialect of "Aurorian", so we may be able to add support for "Gaian"! 

There are a few options.

Option A would be to add the dialect translation to the library `lang-univ`. But this may not always be ideal - the authors of the library may not be the most willing to accept translation rules that are too ad-hoc to be pretty, after all, "Gaia" is a small planet.

So we fall back to Option B: make a fork of `lang-univ` to create a wrapper called `lang-univ-gaian`. You would have sensed - this is "Aggregation"! The wrapper library will be tightly coupled to `lang-univ`, and will forever be dictated and troubled by its updates, architectural changes or disuse.

Option C is much better: we create a separate library called `translator-aurorian-gaian`, and find, ask for or contribute to building a way to integrate translation facilities into `lang-univ`. Now the translation library needs to only focus on its core business, and is free from the constraints of `lang-univ`. Chances are, it's fit for integration with ANY similar libraries that support "Aurorian"!

Needless to say, the same reasoning applies to the design of services or any software system.

# In closing

You see, the essence of "composition over aggregation", is by boiling away the fat,

* to avoid tight coupling by design, and 
* to simply and flatten dependency,
* and more importantly, to maximise the potential of code, functionality, service and why, principles such as "composition over inheritance".