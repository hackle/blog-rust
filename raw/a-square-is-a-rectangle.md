An age-old example from object-oriented literature for the classic Liskov Substitution Principle is the much acclaimed "A square is not a rectangle".

It goes roughly as, `Square` is a sub-type of `Rectangle`, just as the intuition that a square is a special rectangle with equal height and width.

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

A more sophisticated version invests generously in the setters/accessors. I'll spare you the ugly [code listing](https://github.com/hackle/blog-rust/blob/master/sample/square-is-rectange.ts#L16-L40) and show only the gist in the `Square` sub-type.

```TypeScript
class Square1 extends Rectangle1 {
    override set height(value: number) {
        super.height = super.width = value;
    }
}
```
And this of course is surprising if `Square` is used as an `Rectangle` - rightfully so! As LSP points out that a sub-type should satisfy ALL expectations (not just methods but also behaviour) set out by the base class.

Here Object-Oriented literature laments the violation of the mathematical intuition, but not without joy in pointing out the moral of the lesson: that software design is NOT always what you think. No sir, it's a sophisticated and arduous endeavour, definitely not for the faint-hearted...

Oh but hold on! It's time we put a stop to such nonsensical teaching based on a terribly broken example, kept in centre stage for decades with the proliferation of questionable mainstream beliefs. 

Let's bring some sanity by resorting to common sense: if I change the width (and width only) of a square, should I still get a square?

Of course not! I get a rectangle!

The height of the shape should not change automagically - it only does in badly designed software with false assumptions.

The right behaviour is not hard to implement, if we pay some more respect to common sense, and renounce one or two die-hard habits.

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
1. setting `height` of (or "stretching") a `Rectangle`, including the special case of `Square`, will result in another `Rectangle`. 
2. calling `setHeight` on a `Square` should NEVER magically set its `width`.

Do you see what die-hard habits I was alluding to? Let me spell it out,

* mutation: if `Square.height = 5` is prohibited, and all fields are made `readonly`, we have immutable data structure, therefore a `Square` cannot be manipulated out of shape (pun intended). The `Square` type is stronger for this reason. See why so many languages are pushing for immutability?
* mutation again, with class and `this`. The convenience of mutating the state of an instance with `this` can be a costly one: any method with a handle to `this` are given full reign over the internals of the class instance; its intent can be hidden from the method type signature (worse when the method returns nothing, such as a `setter`). 

If we go ahead further, the source of evil is the entrenched teaching to mix data and behaviour, which hopefully is quickly going out of favour: more modern languages such as Rust and Go encourage us to keep data and behaviour separate, while offering a flavour of dot notation similar to that of classes.

Hope we are now on the same page on the age-old non-sense, "A square is not a rectangle". Quite the broken example steeped in the intrinsic shortcoming of the unfortunate combination of classes and mutation, and it does 0 justice to the principle by the great Babara Liskov.