## A head-scratcher

TypeScript can be baffling sometimes. For example, it refuses to accept the below implementation for a very simple `ap` that intends to return `'Am'` for `'Am'` and `'Pm'` for `'Pm'`, how hard could it be?!

```TypeScript
type AmPm = 'Am' | 'Pm';

function ap<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}
```

The error message is quite a head-scratcher.

> Type '"Am"' is not assignable to type 'T'.
> '"Am"' is assignable to the constraint of type 'T', but 'T' could be instantiated with a different subtype of constraint 'AmPm'.ts(2322)

We know very well this function works as expected for the callers.

```TypeScript
// const am: "Am"
const am = ap('Am');
```

To add to the confusion, these forms below will type-check just fine - not without their own quirks. Besides, they are not exactly what we wanted with `ap`. And my eyes! The atrocity of `as T`!!!

```TypeScript
function ap1<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        // val: T extends AmPm
        return val; 
    }

    return val;
}

// but return type is AmPm
function ap2(val: AmPm): AmPm {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}

function apX<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        // NO!!! Casting!!!
        return 'Am' as T;
    }

    return 'Pm' as T;
}
```

## Type-narrowing is not at fault

Why? But why? Some people complain that for `ap1`, type narrowing doesn't work, `val` should be narrowed down to `Am` within the `if` block. That's actually not the case, as is evident below.

```TypeScript
function ap4<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        // const result: "Am"
        const result = (a => a)(val);

        return result;  // same error as ap
    }

    return val;
}
```

Using the trick `(a => a)(val)` we can prove `val` is actually narrowed down to `"Am"`, to result in the same error as the original `ap`.

The REAL problem is, TypeScript does not narrow down return types from control flow analysis. As a refresher, a function's return type is either,

* left to be inferred. In this case, the return type is the union of all possible return values. This is seen below,

    ```TypeScript
    function ap5(val: AmPm) {
        if (val === 'Am') {
            return 'Am';
        }

        return 'Pm';
    }

    // const returnOfAp5: "Am" | "Pm"
    declare const returnOfAp5: ReturnType<typeof ap5>;
    ```

* explicitly set when the function is declared. In this case, the return type will constraint any return value(s) within the function. This is where `ap` has problems getting type-checked.

## Sets, subsets, branches and overloads

To really understand the problem, we need to be pedantic with what `T extends AmPm` really means. Conveniently, we may think it means that `T` can be one of `"Am" | "Pm"`, an understanding that works reasonably well *most* of the time. But this cannot be further from the truth! What this really means is, `T` can be any of these types,

1. `"Am" | "Pm"`
2. `"Am"`
3. `"Pm"`
4. `never`


This makes more sense if we think about sets. All 4 variations are subsets of the type `"Am" | "Pm"`, including `never` as it's empty!

Now let's look at `function ap<T extends AmPm>(val: T): T` again. It says `T` can be any one of these 4 possibilities; but ONLY ONE, it cannot be 2 at the same time. This is quite clear at the call-site, when the type acts as the contract, for example `const am = ap('Am')`.

However, within the function implementation, `T` is not known, so it must remain *uncertain* and be any of the 4 variations.

But it is known, you say! Because,

```TypeScript
if (val === 'Am') {
    return 'Am';
}
```

This clearly narrows down `T` to `"Am"`! This is actually true, and we can say for this branch, `ap` is of type `'Am' => 'Am'`. The other branch, `ap : 'Pm' => 'Pm'`. This leads us down a good route, as now `ap` takes two forms, that aligns very well with the overload syntax!

```TypeScript
function ap(val: 'Am'): 'Am';
function ap(val: 'Pm'): 'Pm';
function ap(val: AmPm): AmPm {
    // same code as before ...
}

// const am: "Am"
const am = ap('Am');
```

And this works! Should TypeScript have considered these two forms equivalent, and allowed this to go? Many people definitely think so in this [discussion](https://github.com/microsoft/TypeScript/issues/24929) and [this other discussion](https://github.com/microsoft/TypeScript/issues/22735), but one point is missing here.

## A point is missing

Let's assume TypeScript does type-narrow the return type based on the implementation, what does it do to a slightly more complex `ap7`, this time with two parameters of the same type `AmPm`.

```TypeScript
function ap7<T extends AmPm>(
    val1: T,
    val2: T,
): T {
    if (val1 === 'Am') {
        return val2;    // should val2 be 'Am' too?
    }

    return val1;
}
```

Should val2 be `"Am"` because `val1 : "Am"`? The are both of type `T extends AmPm` after all. Can't be any clearer!

Not necessarily, and here is the catch: although `val1 : "Am"` holds, `val2` can still be `"Pm"`, which means `T : AmPm`. This is perfectly fine! It's one of the 4 possibilities of `T extends AmPm`. If TypeScript has kicked in type-narrowing on the return type and forced `T` to be `"Am"`, it would have been completely wrong!

## It's obvious with subtyping

If we generalise `T` to be any type, not just unions, this answer can be made even more obvious - even trivial if we bring in subtyping. Consider,

```TypeScript
function self<T extends Person>(p: T): T {
    const person: Person = {...};
    return person;
}

// type `Teacher` is a subtype of `Person`
const teacher: Teacher = {...};

const teacherSelf = self(teacher); // Not right! `teacherSelf` is of type `Person`
```

This is obviously wrong! `self(teacher)` should return a `Teacher` type, not a `Person` type.

Now you should understand the error message, and let's sub in the types.

```TypeScript
Type 'Person' is not assignable to type 'Teacher'.
  'Person' is assignable to the constraint of type 'Person', but 'T' could be instantiated with 'Teacher'.ts(2322)
```

## The dreadful alternative

But hope is not all lost. We can still argue, in this case the programmer should check both `val1` and `val2` to help TypeScript decide what `T` is. In effect, we promise to do the below,

```TypeScript
function ap8<T extends AmPm>(
    val1: T,
    val2: T,
): T {
    const vals: [T, T] = [val1, val2];
    switch (vals) {
        case ['Am', 'Am']: ... // T must be 'Am'!
        case ['Pm', 'Pm']: ... // T must be 'Pm'
        case ['Am', 'Pm']: ... // T is still AmPm
        case ['Pm', 'Am']: ... // T is still AmPm
    }
}
```

Aha, cornered, TypeScript! Now you must do the right thing for us so we have guarantee for correctness! 

Except - would you be happy to write code in this fashion, and commit to doing so? Not me. Imagine a union type consisting of 5 types, and the size of `switch / case` I have to write! A dreadfully boring prospect indeed. 

People! We've just found a **must-cast** situation, endorsed by [Anders Hejlsberg](https://github.com/microsoft/TypeScript/issues/22735#issuecomment-374817151) himself.

And finally, when the time comes, I will be using `as T` or even `as any` with a (barely noticeable) smile on my face, knowing no shame could be coming my way.