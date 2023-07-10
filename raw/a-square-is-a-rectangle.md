An age-old example from Object-Oriented literature for the classic Liskov Substitution Principle is the much acclaimed "A square is not a rectangle".

It goes roughly as, `Square` is a sub-type of `Rectangle`, just as the intuition that a square is a special rectangle with equal height and width. In plain simple TypeScript,

```TypeScript
class Rectangle0 {
    constructor(public width: number, public height: number) {}
}

class Square0 extends Rectangle0 {
    constructor(side: number) {
        super(side, side)
    }
}
```

For dramatic effect, here we say "so far so good, but..." the intuition breaks down when we try to set `Square.height`, the `Square` is no longer a `Square`. Bummer!!!

```TypeScript
const square0 = new Square0(5);
// Oh NO! height != width This is no longer a Square 
square0.height = 4;
```

A more sophisticated version invests generously in setters/accessors. I'll spare you the ugly [code listing](https://github.com/hackle/blog-rust/blob/master/sample/square-is-rectange.ts#L16-L40) and show only the gist in the `Square` sub-type.

```TypeScript
class Square1 extends Rectangle1 {
    // same goes for: override set width(value: number)
    override set height(value: number) {
        super.height = super.width = value;
    }
}
```

This looks reasonable for the `Square`, but is surprising if we consider the base class - `Square`'s behaviour deviates from that of `Rectangle`, whose `width` and `height` are *expected* to change independently. As LSP points out, a sub-type should satisfy ALL expectations set out by the base class, both in appearance and in spirit!

Here Object-Oriented literature laments the violation of the mathematical intuition, but not without joy in pointing out the moral of the lesson: that software design is NOT always what you think. No sir, it's a sophisticated and arduous endeavour, definitely not for the faint-hearted. 

Sigh, oh well, *a Square Is Not a Rectangle!*

Oh but hold on! It's time we put a stop to such nonsensical teaching based on a terribly broken example, kept in centre stage for decades with the perpetuation of questionable mainstream thinking. 

Let's bring some sanity by resorting to common sense: if I change the width (and width **only**) of a square, should I still get a square? Think hard before jumping to any answers.

Of course not! I get a rectangle!

The height of the shape should not change automagically with the width - it only does so in badly designed software with false assumptions.

The right behaviour is not hard to implement either, if we pay a little respect to common sense, and renounce one or two die-hard habits.

```TypeScript
class Rectangle2 {
    constructor(readonly width: number, readonly height: number) {
    }

    setHeight(height: number): Rectangle2 {
        return new Rectangle2(this.width, height);
    }
}

class Square2 extends Rectangle2 {
    constructor(readonly side: number) {
        super(side, side);
    }
}

const rect2 = new Rectangle2(3, 8);
const square2 = new Square2(4);

// Hello! It's a Rectangle, not a Square
const rect3 = square2.setHeight(5);
```

The gist is with `setHeight(height: number): Rectangle`,

1. setting the `height` of (or "stretching") a `Rectangle`, including the special case of `Square`, will result in another `Rectangle`. 
2. calling `setHeight` on a `Square` should NEVER magically set its `width`. In fact, automagically setting `width` when the caller calls `setHeight`, is the smacking violation of LSP.

Now let's zoom in. Do you see what die-hard habits I was alluding to that should be "renounced"? Let me spell it out,

* mutation: if `Square.height = 5` is prohibited, and all fields are made `readonly`, we have immutable data structure, therefore a `Square` cannot be manipulated out of shape (pun intended). The `Square` type is stronger for this reason. 
* mutation again, with class and `this`. The convenience of mutating the state of an instance with `this` can be a costly one: any method with a handle to `this` are given full reign over the internals of the class instance; its intent can be hidden from the method's type signature (worse when the method returns nothing, such as a `setter`). 

See why so many languages are pushing for immutability?

If we go a bit further, another source of evil is the entrenched teaching to mix data and behaviour, which hopefully is quickly going out of favour: more modern languages such as Rust and Go encourage us to keep data and behaviour separate, while offering a flavour of dot notation similar to that of classes.

Hope we are now on the same page on the age-old non-sense, "A square is not a rectangle". Quite the broken example steeped in the intrinsic shortcoming of the unfortunate combination of classes and mutation, and it does 0 justice to the principle by the great Babara Liskov.

PS. with all the said about the *solution*, I am not stating that this *problem* is meaningless and should be discarded for good. Instead, it can be a great exercise if presented as a design challenge: how do we model `Square` and `Rectangle` so their behaviours are inline with our mathematical understanding?

This way, we can now pose questions such as: *what if I want change the size of a `Square` to get another `Square`?* 

And the answer may be: you must construct a new `Square`. Why? Because we *choose to design it* so that the constraint of "equal width and height" is enforced through the constructor. Free mutation of width and height side-steps the constructor, therefore must be disallowed to ensure correctness.