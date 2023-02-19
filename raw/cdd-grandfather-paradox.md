Every time somebody raves about how cool the "grandfather paradox" is, I cannot hide my contempt. Come on, we programmers have had this figured out for ages, and it's all cookie talk.

The paradox usually goes as,

> If one goes back in time to kill one's grandfather, then in the new reality, this person wouldn't even exist, then cannot go back in time to kill the grandfather!

This is trivial to model. To make a shortcut, let's say the victim is one's father instead.

```typescript
type Person = {
    name: string,
    father?: Person,
    mother?: Person
}

function haveChild(father: Person, mother: Person): Person {
    return {
        father,
        mother,
        name: `Child of ${father.name} and ${mother.name}`
    };
}

const father: Person = { name: 'father' };
const mother: Person = { name: 'mother' };

const timeTraveller = haveChild(father, mother);
console.log(timeTraveller);
// {
//     father: { name: 'father' },
//     mother: { name: 'mother' },
//     name: 'Child of father and mother'
// }

// the time traveller kills the father!
delete timeTraveller.father;
console.log(timeTraveller);
// { mother: { name: 'mother' }, name: 'Child of father and mother' }
```

See, the time traveller's father is gone alright, but the traveller lives on. One can freely change the past without affecting the present. There is no paradox at all!

You would have figured out what I was trying to say here: I am being sarcastic. With mutation, we cannot model the famous "grandfather paradox". In-place update could not reflect cause and effect as the paradox requires.

But hold on, there are more powerful tools to use yet!

## Getters

Getters are great for modelling data dependency, in other word, cause and effect. Let's look at our example again.

```typescript
type Person = {
    name: string
}

class Self {
    constructor(
        public father?: Person, 
        public mother?: Person
    ){}

    get self(): Person | undefined {
        return (this.father && this.mother) ? 
                { name: `Child of ${this.father.name} and ${this.mother.name}`} 
                : undefined;
    }
}

function haveChild(father: Person, mother: Person): Self {
    return new Self(father, mother);
}

const father: Person = { name: 'father' };
const mother: Person = { name: 'mother' };

const timeTraveller = haveChild(father, mother);
console.log(timeTraveller.self);
// { name: 'Child of father and mother' }

delete timeTraveller.father;
console.log(timeTraveller.self);
// undefined
```

Oh! The paradox is in action! The time traveller (in the form of `timeTraveller.self`) is now gone!


## How do I know?

It would seem we have solved the problem, but the following question is: how do we know `timeTraveller.self` has changed (without printing it with `console.log`)?

The answer also seems quite simple - we need only compare the before / after values.

```typescript
const before = timeTraveller.self;
delete timeTraveller.father;
const after = timeTraveller.self;

console.log(`timeTraveller.self has changed? ${before != after}`)
// timeTraveller.self has changed? true
```

However, this is but an illusion, because `delete timeTraveller.father` is inconsequential to equality.

```typescript
const before = timeTraveller.self;
// delete timeTraveller.father;
const after = timeTraveller.self;

// console.log(timeTraveller.self);

console.log(`timeTraveller.self has changed? ${before != after}`)
// timeTraveller.self has changed? true
```

As far as time-travelling is concerned, this is saying even without altering the past, a new person is always born. Obviously this is not ideal. Where can we go from here?

It's easy to argue the we KNOW FOR SURE the time traveller has not changed anything so a new `self` should not be created; however it means we need to make the getter of `get self()` be aware of it's past values so a comparison can be made. This calls for more smartness.

```typescript
class Self {
    private _oldSelf?: Person;

    get self(): Person | undefined {
        const newSelf = (this.father && this.mother) ? 
                { name: `Child of ${this.father.name} and ${this.mother.name}`} 
                : undefined;

        if (newSelf != this._oldSelf) this._oldSelf = newSelf;

        return this._oldSelf;
    }
}
```

Alas, some ugly code to get such a simple thing done. Unfortunately, the ugliness does not help here: `newSelf != this._oldSelf` would always be true at least in JavaScript, so we need to put in more smarts.

```typescript
    if (JSON.stringify(newSelf) != JSON.stringify(this._oldSelf)) this._oldSelf = newSelf;
```

This works as expected - but at what cost?!

The true JavaScript programmer will be annoyed at the final use of `JSON.stringify` for various reasons that I would not detail. The point is, we eventually arrive at the point of discussion: value equality.

## Value equality

While developers love to bicker no-end of "abstractions", "architecture" and "design patterns", it's amazing how far we have managed to get done without sorting out one of the fundamentals: equality.

Value equality and reference equality were taken for granted since day one for most of us, yet this is leaky at its best: anything beside the obvious primitive types cannot be distinguished between a "value" type or a "reference" type, if ever supported.

In C#, without peeking the definition, can you tell if a `Person` type is a value type (`struct`) or a reference type (non-data `class`)?

The default choice of `class` and reference equality get us pretty far, but maybe no further. The boom of client-side and front-end applications gave rise to a very improbable term: change detection, which translates to "has `timeTraveller.self` changed?"

If you think `JSON.stringify` for change detection is ugly, have a look at [NotifyPropertyChanged() in WinForms](https://learn.microsoft.com/en-us/dotnet/desktop/winforms/controls/raise-change-notifications--bindingsource?view=netframeworkdesktop-4.8), where code is injected into EVERY SINGLE `setter` to manually detect changes!

Maybe more famously, [Scope $watch in AngularJS](https://docs.angularjs.org/guide/scope#scope-watch-performance-considerations).

It was not until `React` came along that the front-end world came to the realisation that there are no other ways but to bite the bullet and put an end to the reference equality fiasco: data update is done via creating a new reference; essentially, no more in-place mutation. Effective, immutability + reference equality == value equality.

However, this is never discovered - but always rediscovered, as the [Elm Architecture puts perfectly](https://guide.elm-lang.org/architecture/).

As with other disciplines, immutability is boring - we just keep creating a new value.

```typescript
const before = {
    father,
    mother,
    name: `Child of ${father.name} and ${mother.name}` 
    };

const after = {
    mother,
    name: `Oh no the time traveller has killed the father!` 
    };

// or after = { ...before, father: undefined, name: "xxx" }
```

For more sophisticated use cases we may reach for `reduce / fold` or recursion - but the idea is the same: creating new values, not mutating existing values.

## Reactivity

The maintainers of React made some pretty brave calls, the biggest is to retire class components for function components. This is hardly surprising as immutability and functions naturally go hand-in-hand.

There are still sentiments that the Elm / React way of reactivity, being based on immutability, is not "natural" to programmers (despite the architecture being wild popularity in many other frameworks). 

The [Reactive extensions](https://github.com/Reactive-Extensions/RxJS) are a cross-language convention for reactive programming and it fully embraces functional programming philosophies. However it suffers from a pretty heavy syntax and a bit of learning curve.

Svelte makes a strong case with reactivity built into the compiler that enables (almost) native JavaScript syntax. However, it side steps immutability with the age old [NotifyPropertyChanged trick](https://stackoverflow.com/a/66764316), so there are quirks like this (copied from [Varcel](https://vercel.com/docs/beginner-sveltekit/reactivity)),

```javascript
<script>
  let quantity = 0;
  let inventory = [];
  function addToCart() {
    inventory.push(quantity);
    inventory = inventory;
    quantity = ++quantity;
  }
  let inventory = [];
</script>

<div>Your shopping cart has {quantity} items.</div>
<button on:click="{addToCart}">Add To Cart</button>
<div>{inventory}</div>
```

> I write inventory = inventory. This may seem a little redundant as it may be tempting to call inventory.push(quantity) – but if you were to test this out in the browser, you would see that our inventory array is not updating. This is because the Array.push method in Javascript actually mutates an existing array, but it leaves the overall Array object itself unchanged. To actually re-render our app we need to make sure to always use the assignment operator. Adding inventory = inventory on the next line is necessary to trigger an update. The general takeaway here is, if you want to update a reactive variable, always use the equals sign.

Here is my bet: Despite its "simplicity", Svelte will never catch on for dominance unless it fully embraces immutability. React may be bloated and with its own quirks (hello hooks!), but it's heading in the right direction with a sound foundation.

With that said, I am by no means obsessed with React. Would a fully reactive language emerge to take over the world? If ever, this is the time.

## Convenience vs discipline

You see, mutation is convenient (and performant), and it has taken us a long long way. But it messes with one of the fundamentals of reasoning: equality. How can we make sense of the program we create if we cannot be sure the same data is equal to itself? And different data are not equal?

I fully appreciate value equality has become popular in the last few years: struct by default (Go, Rust), data classes (Kotlin, Python), record classes (C#).

However this may not be enough to change the game as long as software engineers go for the convenience of in-place mutation - when we reach for `timeTraveller.father = undefined` to action a change, the hard-earned advice from the language designers is thrown out the window.

We've come this far to understand that building anything non-trivial on the convenience of mutation is a recipe for pain at best. Time to inject some discipline to our ways: embrace immutability. Physics has an explanation for this: when the past is changed, the old reality lives on, and a new parallel reality is created. Why, it's the [many worlds](https://en.wikipedia.org/wiki/Many-worlds_interpretation)!