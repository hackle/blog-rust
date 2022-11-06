One of the thrills of learning Haskell, is how something unexpected can come up out of the blue, and completely invalidates my existing knowledge.

For example, learners of functional programming may feel pretty good about being able to use the likes of map, filter, find and reverse fluently, until the moment that we find out all these list functions can be implemented using reduce alone.

A similar moment took place for me a while ago, this time about any recursion.

## Look mum, I can do recursion!

A number of Haskell tutorials would show us how to write recursion data types, such as this simple Tree.

```haskell
data Tree a = Leaf a | Node (Tree a) (Tree a)
```

This makes for straightforward pattern matching. 

```haskell
showTree :: Show a => Tree a -> String
showTree (Leaf a) = show a
showTree (Node l r) = showTree l ++ " " ++ showTree r

-- cabal ghci
ghci> myTree = Node (Node (Leaf 1) (Leaf 2)) (Node (Leaf 3) (Leaf 4))
ghci> showTree myTree
"1 2 3 4"
```

So intuitive! And we usually feel pretty good about ourselves at this moment. I was a bit drunk with power then.

As is with real life or Haskell alike, when such feelings hit, quite likely it's NOT truly a time for self-congratulation, no people! Much, much better! It usually means a new landscape is opening up, and curse if we linger on the drunkenness!

## A curious Recursive type

The brilliant people out there tell us: manual recursion is fun for a while, but quickly gets boring. So they devised this one-for-all recursive type,

```haskell
data Rec f = R { unR :: f (Rec f) }
```

It's a pretty curious type isn't it, being infinitely recursive? Notice it needs a `f` that accepts a type parameter itself (or, `f` is of kind `* -> *`). 

Suppose we try to construct a value for `Rec`, oh, I happen to know something of kind `* -> *`.

```haskell
ghci> :t R (Just (R Nothing))
R (Just (R Nothing)) :: Rec Maybe
```

Well, I can construct a value for it, but it's not very meaningful, `R (Just (R Nothing))` hardly contains any data. Maybe a type of kind `* -> * -> *`?

```haskell
ghci> :t R (Left "oh!")
R (Left "oh!") :: Rec (Either String)
```

This is more meaningful - at least there is an `"oh"` in the data. Supposed we try `Right`?

```haskell
ghci> :t R (Right "oh!")

<interactive>:1:10: error:
    • Couldn't match type: [Char]
                     with: Rec (Either a)
      Expected: Rec (Either a)
        Actual: String

ghci> :t R (Right (R (Left "oh!")))
R (Right (R (Left "oh!"))) :: Rec (Either String)
```

`Right String` won't work because `Rec` must be recursive, and `String` does not satisfy the expected `Rec (Either a)`, but we manage a valid `R (Right (R (Left "oh!")))` that checks all the boxes.

I don't want to alarm you, but we have effectively made two types `Maybe` and `Either` *recursive* with this strange `Rec` type! These types are not really known for being recursive. Let that sink in...

## Back to Tree

Knowing how `Rec` works, let's doctor the `Tree` type a little so it accepts two type parameters. 

```haskell
data TreeR a r = LeafR a | NodeR r r deriving (Show)
```

Note `TreeR` is not recursive by definition, and it allows values like `NodeR 2 2`.

It's obviously a `Functor`, so let's implement it,

```haskell
instance Functor (TreeR a) where
  fmap f (LeafR a) = LeafR a
  fmap f (NodeR l r) = NodeR (f l) (f r)

ghci> fmap (+ 1) (LeafR 1)
LeafR 1
ghci> fmap (+ 1) (NodeR 1 2)
NodeR 2 3
```

Compared to the original `Tree`, `TreeR` is strange as it maps over `NodeR` but leaves `LeafR` untouched, because it's functorial in its second parameter `r`, not the first one `a`. 

But how do we make `TreeR` recursive? The name `r` should have given it away.

## Recursive TreeR

The combination of `TreeR` and `Rec` gives rise to recursion,

```haskell
myTreeR :: Rec (TreeR Int)
myTreeR = R (NodeR 
              (R (NodeR (R (LeafR 1)) (R (LeafR 2))))
              (R (NodeR (R (LeafR 3)) (R (LeafR 4)))))
```

Can you recognise `r` in `TreeR a r`? It's `Rec (TreeR Int)` itself! Which can be expanded to `Rec (TreeR Int (Rec (TreeR Int (Rec ...))))`, Cool!

Now supposed we need to show all the elements of `myTreeR` in order. It's not a straightforward reduce, map or fold, so let's write our own.

```haskell
showTreeR :: Rec (TreeR Int) -> String
showTreeR (R (LeafR a)) = show a
showTreeR (R (NodeR l r)) = showTreeR l ++ " " ++ showTreeR r

ghci> showTreeR myTreeR
"1 2 3 4"
```

Did you notice how `LeafR` and `NodeR` are handled differently? A `LeafR` has an `Int` inside, so we call `show a`; but `NodeR` would have its branches built as `String`s via recursion. However, they do converge on `String`. This is important.

Not so bad, we say, but didn't we say the point of `Rec` is to reduce manual recursion? We are back at ground zero. What's all the fuss about?!

Taking a closer look, I do notice `showTreeR` is suspiciously similar to the `Functor` implementation. Sure we can use `fmap`?

```haskell
showTreeR2 :: Rec (TreeR Int) -> String
showTreeR2 (R r) = case fmap showTreeR2 r of
                    LeafR a -> show a
                    NodeR l r -> l ++ " " ++ r

ghci> showTreeR2 myTreeR
"1 2 3 4"
```

That's truly interesting. The recursion is moved to `fmap showTreeR2 r`, and the case-split does not use recursion at all. Cool again!

## Lifting

We can make a more useful version `showTreeR3` by lifting the conversion from `TreeR` to `String` to a function `showTreeFlat`.

```haskell
showTreeR3 :: (TreeR Int String -> String) -> Rec (TreeR Int) -> String
showTreeR3 f (R r) = let inner = fmap (showTreeR3 f) r in f inner

showTreeFlat :: TreeR Int String -> String
showTreeFlat (LeafR a) = show a
showTreeFlat (NodeR l r) = l ++ " " ++ r

ghci> showTreeR3 showTreeFlat myTreeR
"1 2 3 4"
```

Note how we arrive at `TreeR Int String -> String` where the `String` is lined up ("converge") with the eventual return type, but not `Int`? If we recall the definition of `data TreeR a r = LeafR a | NodeR r r`, a function of type `TreeR a r -> r` implies it encapsulates `a -> r`, as `show` in `showTreeFlat`. Pleasant hindsight.

## "Genericise"

Why stop while we can still make `showTreeR3` much more generic? Without changing the implementation, we can add a requirement for `Functor` in order to use `fmap`, to arrive at,

```haskell
showTreeR4 :: Functor f => (f a -> a) -> Rec f -> a
showTreeR4 f (R r) = let inner = fmap (showTreeR4 f) r in f inner

ghci> showTreeR4 showTreeFlat myTreeR
"1 2 3 4"
```

Fair to say this is pretty high-concept, in particular `Rec f -> a` strongly implies `Rec f` encapsulates some `a`, but it's not visible in the type of `Rec f` at all!

This of course is hinted at with `f a -> a`, but this itself is cryptic, as `Rec f` expands to `f (Rec f (Rec f))`, there is no hint of `a`. Therefore, it's very important to remember how we got here step by step.

Of course we realise `showTreeR4` needs to be renamed to fit its more generic purpose. Indeed, it is well-known in the name `cata`, short for `catamorphism` - collapsing a structure into a single value.

`cata` works for any recursive type, even `Either`!

```haskell
resultR :: Rec (Either Bool)
resultR = R (Right (R (Right (R (Left True)))))

exclaim :: Either Bool String -> String
exclaim (Left l) = "it's " ++ show l
exclaim (Right r) = r ++ "!"

ghci> cata exclaim resultR
"it's True!!"
```

Isn't it amazing? 

There are other functions that work on recursive data structures like `cata`, such as `ana`, `apo`, `para`, `zygo`... This family of functions are otherwise referred to as, behold, "recursion schemes".

No doubt, recursion schemes do take away the fun of writing recursion manually. But it more than makes up for it, by revealing a fantastic landscape!

## References

This post is basically my study notes for this classic paper [Functional Programming with Bananas, Lenses, Envelopes and Barbed Wire](https://eprints.eemcs.utwente.nl/7281/01/db-utwente-40501F46.pdf) and [this amazing series](https://blog.sumtypeofway.com/posts/introduction-to-recursion-schemes.html) by [Patrick Thomson](https://blog.sumtypeofway.com/), who shared much much more information about recursion schemes.

The `Rec` type is a synonym to the famous [`Fix` type](https://hackage.haskell.org/package/data-fix-0.3.2/docs/src/Data.Fix.html#Fix).