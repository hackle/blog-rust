TypeScript can be baffling sometimes. For example, it refuses to accept the below code.

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

To add to the confusion, these two forms below will type check just fine, with their own quirks.

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
```

Why? But why? Some people complain that for `ap1`, type narrowing doesn't work, `val` should be narrowed down to `Am` within the `if` block. That's actually not the case here, as is evident below.

```TypeScript
function ap4<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        // const result: "Am"
        const result = (a => a)(val);

        return result;  // same error
    }

    return val;
}
```

Using the trick `(a => a)(val)` proves `val` is actually narrowed down to `"Am"`, therefore to result in the same error as the original `ap`.

The REAL problem is, TypeScript does not narrow down return types from control flow analysis. The return type is either,

* left to be inferred. In this case, it's the union of the types of all possible return values. This is seen below,

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

* explicitly set when the function is declared. In this case, the return type will constraint any return value(s) within the function. This is where `ap` has problems getting type checked.

To really understand the problem, we need to be pedantic with what `T extends AmPm` really means - `T` can be any of these types,

1. `"Am" | "Pm"`
2. `"Am"`
3. `"Pm"`
4. `never`


This makes more sense if we think about sets. All 4 variations are subsets of the type `"Am" | "Pm"`, including `never` as it's empty!

Now let's look at `function ap<T extends AmPm>(val: T): T` again. It says `T` can be any one of these 4 possibilities; but only ONE, it cannot be 2 at the same time. This is quite clear when the type acts as the contract for any callers, as is the case with `const am = ap('Am')`.

However, within the function implementation, `T` is not known, so it must remain uncertain and be any of the 4 variations.

But it is known, you say! Because,

```TypeScript
if (val === 'Am') {
    return 'Am';
}
```

This clearly narrows down `T` to `"Am"`! This is actually true; the problem is, this leads to `ap` taking various forms, as laid out below with more explicit syntax.

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

Let's assume TypeScript does type-narrow the return type based on the implementation, what should the type of this be?

Let's see it with a more complex type and with two parameters.

It's obvious, this should definitely be disallowed! Because it's not exhaustive. Common sense!

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

Should val2 be `"Am"`? Not necessarily. Because although `val1 : "Am"` holds, `val2` can still be `"Pm"`, which means `T : AmPm`, perfectly fine as it's one of the 4 possibilities of `T extends AmPm`. If TypeScript has kicked in type-narrowing on the return type and forced `T` to be `"Am"`, it would have been completely wrong!

But hope is not all lost. What if we write this,

```TypeScript
function ap8<T extends AmPm>(
    val1: T,
    val2: T,
): T {
    const vals: [T, T] = [val1, val2];
    switch (vals) {
        case ['Am', 'Am']: return 'Am';
        case ['Pm', 'Pm']: return 'Pm';
        // ...
    }
}
```

This would certainly help TypeScript to deterministically narrow down the return type?

Yes it would. But would you be happy to write code in this fashion, and commit to doing so? Not me. Knowing how boring the alternative is, I would gladly use `as T` or even `as any`!