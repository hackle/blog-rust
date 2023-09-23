Applicative and Monad have the reputation of being difficult to grok, not just because of the names, which by now should be fairly popular for better or worse, but also because they can have genuinely magical (albeit lawful) instances and usages, that can catch the unsuspecting readers off guard. I suspect that's why they are referred to by many as "effectful", meaning scary or deliciously tricky.

Let's see how the nuances and confusions are built up. We'll start with `const`, from [GHC.Base](https://hackage.haskell.org/package/base-4.18.1.0/docs/src/GHC.Base.html#const), whitespace includes,

```Haskell
const                   :: a -> b -> a
const x _               =  x
```

So it throws away `b`, as one can guess pretty accurately from its type `a -> b -> a`. Plain, almost boring, this is the effect-less world that most of us are comfortable with. What about it in the "higher" world? Consider `<*`, a seemingly cheap off-shoot of `<*>` (apply). Its documentation says,

> -- | Sequence actions, discarding the value of the second argument.

Doesn't that sound suspiciously similar to `const`? In fact, if we try out a few more naive instances of Applicative,

```Haskell
ghci> :t (<*)
(<*) :: Applicative f => f a -> f b -> f a
ghci> Just 1 <* Just "hello"
Just 1
ghci> Identity 1 <* Identity "hello"
Identity 1
```

It's as if `<*` is exactly `const` specialised to `f a` and `f b`, even more so, below is its [default definition](https://hackage.haskell.org/package/base-4.18.1.0/docs/src/GHC.Base.html#%3C%2A),

```Haskell
class Functor f => Applicative f where
    (<*) :: f a -> f b -> f a
    (<*) = liftA2 const
```

The only issue seems to be, this is not exactly `const`, but a "lifted" version of it. The difference surfaces with more sophisticated instances,

```Haskell
ghci> [1,3] <* [2, 4]
[1,1,3,3]

ghci> print "hello" <* print "world"
"hello"
"world"
```

We trace to the definition of `liftA2` for them,

```Haskell
instance Applicative [] where
    liftA2 f xs ys = [f x y | x <- xs, y <- ys]

instance Applicative IO where
    liftA2 f m1 m2          = do { x1 <- m1; x2 <- m2; return (f x1 x2) }
```

If we substitute `f` with `const`, in both cases, as promised, the immediate result of `f` is thrown away, but the computations are still carried out. We found it, this is the "effect" on top of the `const` we know so well!

The moral of the story is, intuitions are nice, but only if they are the right ones, and when it comes to Applicative and Monad, there are nuances that can be missing from the more naive instances like `Maybe` or `Identity`.

Supposed we never got to the nuances, and one day ran into `for_`, which seems to do nothing and throws the results away, this time, even for the more sophisticated `list` instance,

```Haskell
ghci> :m +Data.Foldable

ghci> for_ [0..5] Just
Just ()

ghci> :m + Data.Functor.Identity
ghci> for_ [0..5] Identity
Identity ()

ghci> :m +Data.List
ghci> for_ [0..5] singleton
[()]
```

But not so with `IO`,

```Haskell
ghci> for_ [0..5] print
0
1
2
3
4
5
```

As `print` returns `IO ()`, and throwing away `()` is more or less an no-op. Try an even more interesting instance,

```Haskell
ghci> :m +Data.Monad.State

ghci> let st = for_ [0..5] (\n -> modify (+ n))
ghci> :t st
st :: (Num s, Enum s, MonadState s f) => f ()
ghci> execState st 0
15
```

True enough, the result is `f ()`, but with `State`, a "state" is aggregated. `for_` is not really imperative (now how is that possible anyway), its documentation (actually of `traverse_`) says as much,

> Map each element of a structure to an Applicative action, evaluate these actions from left to right, and ignore the results.

And fair enough, this is the definition of `traverse_` that uses the mirror of `<*`,

```Haskell
traverse_ f = foldr c (pure ())
  where c x k = f x *> k
```

So any effect from the Applicative instance will be in effect. Pun intended.