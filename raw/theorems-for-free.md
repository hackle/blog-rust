While the genius programmers excel on intuition, a simpler-minded one like myself needs more rigorous methods as safe fall-back. However, there is a misunderstanding that the rigorous methods are simply laborious and boring, bourne out of paranoia; that may be true of primitive forms such as unit testing (even which has rigorous forms); not the really good ones! My go-to example is "theorems for free": from functions with generics (or, parametric function), there is a recipe to **derive** theorems. It's mind-boggling, it's beautiful, and it's free. Well, it's not really *easy* if you go by the [original paper](https://people.mpi-sws.org/~dreyer/tor/papers/wadler.pdf) by the great Philip Wadler, but I think I have an explanation for the dummies, so here we go.

## natural transformation

Natural transformation (or naturality for short) states that for any two functors `f` and `g`, and a polymorphic function `h` defined as below,

```Haskell
h : forall a. f a -> g a
```

It's essential that `h` is total without funny stuff like bottom, exceptions, non-termination etc. If so, then it should hold that,

```Haskell
-- given
k : a0 -> a1
fa0 : f a0    -- the name fa is no more than a mnemonic

-- then
h (fmap k fa0) = fmap k (h fa0)

-- or in point-free style
h . fmap k = fmap k . h
```

If we draw a diagram (as you would find by searching with added keywords "category theory"), it should show that from the same starting point `fa0`, there are two paths `h . fmap k` and `fmap k . h` that reach the same result of type `g a1`, in other words, the paths _commute_. 

The use of `fmap` may need clarification: `fmap` is part of the definition of functor; on the left side, the functor is `f`, on the right side, `g`.

Because naturality is kind of straightforward (relatively - it wasn't the case for me) to get an intuition for, and it's always nice to have an intuition to fall back on, let's use it as a starting point to sneak up to "theorems for free".

"Theorems for free", or sometimes referred to as parametricity, builds on the idea that a parametrically polymorphic function such as `h` should preserve all relations between types. A liberally oversimplified plan of what we will do is,

1. introduce a relation between values of types `a0` and `a1`; specialising the relation to a function (more formally, the graph of a function), 
2. apply the polymorphic function `h` to get output that should preserve the relation, as guaranteed by parametricity,
3. probe, observe and reason with the applications to uncover theorems.

As you can see, it's all "relational"! So let's take a look at the function `h` again,

```Haskell
h : forall a. F a -> G a
```

Note that `h` is only polymorphic in `a` (hence the universal qualification `forall. a`), not in `F` or `G`, which may be any two arbitrary functors. This is important for the next step - pick two arbitrary types in the place of `a`, for convenience, we'll use `a0` and `a1`, but it could be `a10` and `a11`, or `x` and `y`, you name it. We also want `a0` and `a1` to be related by a function `k` as below,

```Haskell
k : a0 -> a1
```

In more formal terms, we introduce a relation `R ⊆ A0 X A1`, and specialise it to function `k` (amongst other specialisations such as tuples or lists that we won't touch on); so `(a0, a1) ∈ R => a1 = k a`, or, "`(a0, a1)` is a member of relation `R`". We put it down nicely as below,

```Haskell
R ⊆ A0 X A1  -- A0 and A1 are related by R

-- specialise R to function k : a0 -> a1
(a0, a1) ∈ R <=> a1 = k a0
```

Remember the act of specialisation of relation `R` to function `k`, and the change of notation from `∈` to `=`. This act will be repeatedly applied in the following steps.

Naturally (pun intended) we also want to expand `R` to `(F a0, F a1)`, which works as below,

```Haskell
-- pick two values, with convenient names
fa0  : F a0
fa1 : F a1 

(fa0, fa1) ∈ F R    -- F R is R lifted to F

-- as R is specialised to k, and F is a functor, F R "lifts" R to fmap k
fa1 = fmap k fa0
```

Now bring in `h`, when applied respectively to `fa0` and `fa1`, the results are related by `F R`, as below,

```Haskell
(fa0, fa1) ∈ F R => (h fa0, h fa1) ∈ G R
```

Now we can expand the relations step by step, as below, 

```Haskell
fa1 = fmap k fa0 => (h fa0, h (fmap k fa0)) ∈ G R

-- g(R) is specialised to fmap k
fmap k (h fa0) = h (fmap k fa0)

-- or in point-free style
fmap k . h = h . fmap k
```

Which is exactly the naturality condition! Let's take a moment to appreciate how amazing this is: by introducing a simple relation `R ⊆ A0 X A1` that is specialised to a function `k`, we are able to derive an otherwise abstract theorem in concrete steps.

## Yoneda lemma

Riding the excitement of natural transformation, we can now try something slightly more sophisticated: Yoneda lemma. In loose terms (feel free to look up the category theory definition), the lemma states that a polymorphic function,

```Haskell
h : forall b. (a -> b) -> F b
```

With `b` being a polymorphic type, `a` any fixed type, and `f` an arbitrary functor, it holds that `h` must encapsulate `F a`, or, `h` is _isomorphic_ to the values of `f a`.

A smart programmer would be able to intuit this, albeit usually with some suspicions. Here is to the peace of mind: we can derive the lemma following the same process as natural transformation, such is the reach of "free theorems". This time, we need an extra step: pick a special function (that satisfies the types) to _probe_ for the theorem. 

First, you know the drill, we introduce the relation,

```Haskell
h : forall b. (a -> b) -> F b

R ⊆ B0 X B1
```

This time, the names change a little because `b` is polymorphic, not `a`. The next step is to specialise `R` to a function,

```Haskell
-- specialise R to a function k
k : b0 -> b1

(b0, b1) ∈ R <=> b1 = k b0
```

This is almost the same as that of the previous example. The next step is slightly more involved, because of the _function_ parameter `a -> b`.

```Haskell
f0 : a -> b0
f1 : a -> b1    -- note a is not polymorphic

(f0, f1) ∈ (a -> R) => (f0 a, f1 a) ∈ R

-- specialise R to k, of type : b0 -> b1
f1 a = k (f0 a)

-- or point-free 
f1 = k . f0
```

In short, these two functions are related by post-composition through `k`. Now we can bring back the original function.

```Haskell
h : forall b. (a -> b) -> F b

(b0, b1) ∈ R, (f0 a, f1 a) ∈ R => (h f0, h f1) ∈ F R

f1 = k . f0 => (h f0, h (k . f0)) ∈ F R

-- F R "lifts" k to fmap k
-- intermediary result
h (k . f0) = fmap k (h f0)  -- (1)

-- recap the types:
f0 : a -> b0
k : b0 -> b1
k . f0 : a -> b1
h (k . f0) : F b1
h f0 : F b0
```

This intermediary result (1) is already telling: the left hand side of type `F b1` hinges on `h f0` and `f0 : a -> b0`. But this is not the lemma yet; to get closer, we must do something a bit mind-bending. When `b0` was introduced, it was meant to be _fixed_ but _unknown_, now we make it fixed and concrete as `a`, as below,

```Haskell
-- b is universally qualified
h : forall b. (a -> b) -> F b

-- it's fair to instantiate b0 as a
h : (a -> b0) -> F b0 => h : (a -> a) -> F a 

-- as a consequence
f0 : a -> a
f0 = id
```

This is completely fair - an universally qualified type can be instantiated as any type (or it wouldn't be truly "universal"), so why not `a`? Of course the choice of `b0` to `a` forces _all_ appearance of `b0` to `a`, so we must make adjustments,

```Haskell
-- now starting from (1)
h (k . f0) = fmap k (h f0)

-- with f0 = id
k : a -> b1

h (k . id) = fmap k (h id)

-- k . id = k
h k = fmap k (h id)

-- recap types
h k : F b1
h id : F a
```

There we have it: the result of `h k : F b1` is fully determined by values of `h id : F a`. (Note we ended up with type `b1` instead of `b`, but remember they are arbitrarily picked types, so it doesn't affect the lemma to use one or the other, as long as the result is consistent.)

The breakthrough is fixing `b0` to `a` to get `f0 = id`: this is where a polymorphic type is kept honest: if it can be _any_ type, then as a "probe", we can specialise it to a concrete type that is _handy_ for exploration. Any property that holds for the polymorphic function must also hold for any concrete type.

If you find it hard to shake off the suspicion of cheating, you are not alone! However, it is actually not the case. The key evidence is that the final result reveals properties of `F b1`, not `F a`; this in turn helps us postulate that even when `b0` is not `a`, the role of `F a` still holds, albeit through an extra post-composition `a -> b0` that is not immediately visible.

It turns out fixing types to get `id` is not only fair, but also very useful, to the point of being a common pattern, which we'll find very handy in the next examples.

What's also important to note - we are free to fix `a0` or `b0`, or both, as long as it's within the confines of the types and parametricity; depending on the choice, the result may or may not be interesting. I am only showing interesting results because ... they are interesting, not because they are the only possibilities.

## map fusion

Using intuition, a smart programmer can figure out map fusion: free of side effects, mapping a list twice should have the same effect as mapping it once, such as,

```TypeScript
[1, 2, 3].map(n => n + 1).map(n => n.toString())

// can be optimised as
[1, 2, 3].map(n => (n + 1).toString())
```

Because the second form saves a "loop", it's often considered a form of optimisation. Such optimisation is often built into data structures such as sequence, enumerable or iterable whose evaluation can be deferred. For example, when programming in C#, using LINQ, mapping twice and mapping once will have the same effect, so it's completely legit to opt for the first form for clarity.

This is also a free theorem that can be derived from the below type. Although it maybe slightly surprising that the process is more complex than the previous two functions.

We start with the type of `map` as below, under the name `m` to show "ignorance" of its implementation.

```Haskell
-- a and b are generic; F is a functor
m : forall a, b. (a -> b) -> F a -> F b
```

There are two universally qualified types `a` and `b` (as specified with `forall`), while `F` is an arbitrary functor but not universally qualified.

As this is the 3rd example, we can skip the introductions and get straight to it.

```Haskell
R ⊆ A0 X A1
r : a0 -> a1   <=> a1 = r a0

S ⊆ B0 X B1
s : b0 -> b1   <=> b1 = s b0

-- this is the (a -> b) part of m
(k0, k1) ∈ R -> S

k0 : a0 -> b0
k1 : a1 -> b1

(k0 a0, k1 a1) ∈ S

s (k0 a0) = k1 (r a0)   -- (1)
s . k0 = k1 . r
```

Here we first flesh out the relations regarding the `(a -> b)`, the first parameter of `m`. Note the result (marked as `(1)`) must hold for any choice of `a` or `b`, which will be updated to be more specific in later steps.

Now we continue with the full type of `m` applied to the fixed types,

```Haskell
m : (a0 -> b0) -> F a0 -> F b0
m : (a1 -> b1) -> F a1 -> F b1

fa0 : F a0
fa1 : F a1

(b0, b1) ∈ S => (m k0 fa0, m k1 fa1) ∈ F S
(fa0, fa1) ∈ F R => (m k0 fa0, m k1 (fmap r fa0)) ∈ F S

(fb0, fb1) ∈ F S

-- F is functor, lifting of graph(s) is fmap s
fmap s fb0 = fb1
=> fmap s (m k0 fa0) = m k1 (fmap r fa0)

-- or point free
fmap s . m k0 = m k1 . fmap r   -- (2)
```

The result `(2)` is moderately revealing. It shows that the composition of `a0 -> b0` then `b0 -> b1` commutes with that of `a0 -> a1` then `a1 -> b1` through lifting to functors. However, we can reveal deeper properties by making more specific choices to the universally qualified types. In this case, we fix `a1` to `a0`, while leaving `b0` and `b1` untouched. This triggers cascading changes.

```Haskell
-- fix a1 to a0
r = id

-- changes to (1)
s . k0 = k1 . id
s . k0 = k1

-- type check
s . k0 : a0 -> b1
k1 : a0 -> b1
```

Fixing `a1` to `a0` is not free-for-all, the overall type, as well as any intermediary result, must be held consistent. By checking the updated types of result `(1)`, we are assured of the consistency. In more advanced literature, this step may be simplified as "let `r` be `id`"; technically, within the constraints of parametricity, the choices of `s`, `k0`, `k` and `r` are fair game (as is the case for `foldr` in the last section).

Now we can swap out `k1` for `s . k0` in result `(2)`, as below,

```Haskell
-- from (2)
fmap s . m k0 = m (s . k0) . fmap id

-- fmap id = id
fmap s . m k0 = m (s . k0)
```

This is map fusion.

## fusion with foldr

The last example is shortcut fusion with `fold`. The intuition is, acting on the final result of `fold` is equivalent to acting on its initial value and each element during folding. The below code shows a flavour (whereas `reduce` in JavaScript works similarly to `fold`).

```TypeScript
> "string sum: " + [1, 2, 3].reduce((acc, cur) => acc + cur.toString(), "")
'string sum: 123'
> [1, 2, 3].map(n => n.toString()).reduce((acc, cur) => acc + cur, "string sum: ")
'string sum: 123'
```

In the case the fold is too simple to be factored further, we can still squees in `fmap id`, yet another example of `id` being a useful reasoning device.

On to the derivation, we start with the variation of choice, `foldr`, and establish the relations as usual.

```Haskell
f : forall a, b. (a -> b -> b) -> b -> [a] -> b

R ⊆ A0 X A1
a1 = r a0

S ⊆ B0 X B1
b1 = s b0
```

The type `(a -> b -> b)` requires some analysis of it own.

```Haskell
K ⊆ R -> S -> S
k0 : a0 -> b0 -> b0
k1 : a1 -> b1 -> b1

(k0 a0 b0, k1 a1 b1) ∈ S
s (k0 a0 b0) = k1 (r a0) (s b0)  -- (1)
```

The intuition for this result is the usual commutation between "act on separately values early on" and "act on the result value at the end".

```Haskell
a0s : [a0]
a1s : [a1]
(a0s, a1s) ∈ [R]
a1s = fmap r a0s    -- (2)

-- applying f
(f k0 b0 a0s, f k1 b1 a1s) ∈ S

-- b1 = s b0 and (2)
(f k0 b0 a0s, f k1 (s b0) (fmap r a0s)) ∈ S
s (f k0 b0 a0s) = f k1 (s b0) (fmap r a0s)    -- (3)

-- or point-free
s . f k0 b0 = f k1 (s b0) . fmap r
```

The result type is quite a handful, but if we keep calm and read, we can tie up the intuition: acting on the result of fold over `a0s`, is the same as mapping over `a0s`, then fold over the intermediary result, with necessary conversions (for `a0 -> b1` and `b0 -> b1`). In other words, the latter form can be "fused" into the first form.
