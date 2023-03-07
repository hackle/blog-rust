A friend asked me about the `State` Monad. He enjoyed a honey-moon with Monads such as `Maybe`, `List` and `Either`, but `State` appears to be next-level. It brings non-local states, it encodes a function, and often appears to be dark magic. 

So I tried to find him a good introduction, and alas, I got myself mighty confused in the process - such is the curse of Monad tutorials!

But `State` is nothing more than good ol' currying with a flourish. So here comes a very special introduction for those who are already comfortable with the idea of Monads, are not scared of type signatures, and don't like beating around the bush with motivational examples.

This leaves me an audience of about 10 people, so I'll get right to it.

## (State s a) type by type

```haskell
-- take a simple function
(a -> b)
-- add state s to the side, it's now a stateful function
(a, s) -> (b, s)

-- what about function composition?
(a -> b) -> (b -> c) -> (a -> c)
-- do the same thing: add state s, and apply a few transformations
   ((a, s) -> (b, s))   -> ((b, s) -> (c, s))   -> ((a, s) -> (c, s))
== (a -> s -> (b, s))   -> (b -> s -> (c, s))   -> (a -> s -> (c, s))    -- currying
== (a -> (s -> (b, s))) -> (b -> (s -> (c, s))) -> (a -> (s -> (c, s)))  -- partial application
       newtype State s a = State (s -> (a, s)) -- this is the "stunt"
== (a -> State s b)     ->  (b -> State s c)    -> (a -> State s c)      -- substitution 
== (a -> m b) -> (b -> m c) -> (a -> m c)
== (>=>)    -- "Kleisli arrow" from Control.Monad
```

Note this is an intuition, not a proof. This intuition is built with step-by-step transformation of types, from function composition to Monad composition.

Finding this a bit dense? No worries, I've got some examples anyway.

## From types to examples

We are doing the opposite of what most monad tutorials do: to create examples from the types.

It's easy to get started too, we just pick any silly little function,

```haskell
charToInt :: Char -> Int
charToInt c = read [c]
```

So far so good? Now let's add a state. 

### Add an evil state

There can be a million reasons to use a state. Sometimes the state influences the computation, sometimes not. The state can also be written to, or/and read from.

For this example I will add a "evil" state that distorts the result of `charToInt`.

```haskell
type EvilState = Int    -- to avoid confusion with a plain `Int`

charToIntS :: (Char, EvilState) -> (Int, EvilState)
charToIntS (c, s) = let s1 = read [c] in (s1 * s, s1)

ghci> charToIntS ('2', 3) 
(6,2)
ghci> let (n, s) = charToIntS ('2', 3) in charToIntS('2', s)
(4,2)
```

You see, it's "evil" because `charToIntS` (with an `S`) seems "indeterministic" compared to its plain, stateless predecessor. 

### Composition

There is nothing wrong with passing the state around, in fact, it should be encouraged over implicit states. However, passing states can become a bit much. Let me add another silly function `intToList`, which can be composed with `charToInt`. 

```haskell
intToList :: Int -> [Int]
intToList n = [n]

charToIntList :: Char -> [Int]
charToIntList = intToList . charToInt

ghci> charToIntList '2'
[2]
```

The "stateful" version is routine to make too. (Never mind the implementation of `intToListS`, as long as you get the idea that it's "stateful".)

```haskell
intToListS :: (Int, EvilState) -> ([Int], EvilState)
intToListS (n, s) = let s1 = n * s in ([s1], s1)

charToIntListS :: (Char, EvilState) -> ([Int], EvilState)
charToIntListS = intToListS . charToIntS

ghci> charToIntListS ('2', 3)
([12],12)
```

See how it can get unwieldy as more and more functions have to use states. Sometimes, a function A does not access the state, but it uses another function B that does, then function A must follow the pattern `(a, State) -> (b, State)` in order to pass the state along. Annoying!

How do we get out of this? 

### Stunt 1: currying!

Watch out - I am going to pull a stunt! 

Oh well, I exaggerate, it's only 2 steps: currying + partial application. And by "partial application" I really just mean adding `()`.

```haskell
    ((Char, EvilState) -> (Int, EvilState))         -- charToIntS
->  ((Int, EvilState) -> ([Int], EvilState))     -- intToListS
->  ((Char, EvilState) -> ([Int], EvilState))    -- charToIntListS

-- currying
    (Char -> EvilState -> (Int, EvilState))         
->  (Int  -> EvilState -> ([Int], EvilState))     
->  (Char -> EvilState -> ([Int], EvilState))    

-- partial application, note pattern?
    (Char -> (EvilState -> (Int, EvilState)))         
->  (Int ->  (EvilState -> ([Int], EvilState)))     
->  (Char -> (EvilState -> ([Int], EvilState)))   
```

Did you see the pattern `a -> (s -> (b, s))`? I am making a big fuss about it, but really, it's simply the result of currying + adding `()`. Feel free to update the implementation - it shouldn't be fairly routine.

As developers do, when there is repetition, we create a type. In this case, smart people figured out that we can create the famous `State` type. Behold!

### The State Monad: an underwhelming introduction

```haskell
newtype State s a = State (s -> (a, s))
```

Fair to say, `s -> (a, s)` is not made for fast digestion. Does it kind of imply state `s` can be used to produce `a`?

Not necessarily - in practice there are countless reasons to use a state. While it's usually the case that `s` and `a` are indeed related, such relation is not strictly required. I personally find it more intuitive to use the type-by-type transformation: "normal" functions with state on the side naturally lead to the `State s a` pattern.

Let's slot in `State s a`,

```haskell
   (Char -> (State EvilState Int))         
-> (Int ->  (State EvilState [Int]))     
-> (Char -> (State EvilState [Int]))
```

If you try to catch up with the implementation, there would be a fair bit of wrapping and unwrapping; but if we focus only on the types, they should remind us of monad composition. Indeed, the above types can be generalised to, 

```haskell
    (a -> m b)
->  (b -> m c)
->  (a -> m c)
```

It's none other than the fish operator `>=>`, or the Kleisli arrow, according to [hoogle](https://hoogle.haskell.org/?hoogle=%28a+-%3E+m+b%29+-%3E++%28b+-%3E+m+c%29+-%3E++%28a+-%3E+m+c%29&scope=set%3Astackage).

Before it's too late, we still need to implement the monad class. Luckily this is straightforward (try it out yourself!). Below is a very naive version.

```haskell
instance Functor (State s) where
    fmap a2b (State f) = State $ \s -> let (a, s1) = f s in (a2b a, s1)

instance Applicative (State s) where
    pure a = State $ \s -> (a, s)
    (State g) <*> (State f) = State $ \s -> let (a, s1) = f s; (a2b, s2) = g s1 in (a2b a, s2)

instance Monad (State s) where
    return = pure
    (State f) >>= g = State $ \s -> let (a, s1) = f s; (State h) = g a in h s1
```

This prompts more refactoring of the "stateful" functions.

```haskell
charToIntM :: Char -> State EvilState Int
charToIntM c = State $ \s -> let s1 = read [c] in (s1 * s, s1)

intToListM :: Int -> State EvilState [Int]
intToListM n = State $ \s -> let s1 = n * s in ([s1], s1)

charToIntListM :: Char -> State EvilState [Int]
charToIntListM c = do
    n <- charToIntListM c
    ns <- intToListM n
    return ns
-- or simply: charToIntListM >=> intToListM

ghci> let (State f) = charToIntListM '2' in f 2
([8],8)
```

So `State s` is a proper monad, bravo! But alas, this revelation has not made our example any simpler. (I hear you, it's fun to use the "fish" operator over the less fancy `.`)

That's because we aren't done yet. Proper "statefulness" cannot be announced without `putState` and `getState`. Behold...

### Stunt 2: getter and setter

The famous `getState` helps us grab the state from "thin air". It's defined as,

```haskell
getState :: State s s
getState = State $ \s -> (s, s)

-- silly usage
currentState :: State s s
currentState = do
    st <- getState
    return st
```

You can see `State s s` is a smart trick - if `State s a` can have any `a`, why not `s` to make it `State s s`?

`putState` is reminiscent of the imperative "setter" that sets the state and returns `void`. Of course in Haskell `void` is quite a different beast, so we use `()`.

```haskell
charToIntM1 :: Char -> State EvilState Int
charToIntM1 c = do
    s <- getState
    let s1 = read [c]
    putState s1
    return $ s1 * s

intToListM1 :: Int -> State EvilState [Int]
intToListM1 n = do
    s <- getState
    let s1 = n * s
    putState s1
    return [s1]

charToIntListM1 :: Char -> State EvilState [Int]
charToIntListM1 c = do
    n <- charToIntM1 c
    ns <- intToListM1 n
    return ns

ghci> let (State f) = charToIntListM1 '3' in f 2
([18],18)
```

Are you getting the imperative vibe? (I must admit seeing the `putState` and `return` "statements" does give me creeps!)

But the imperative feel does not stop here. Here is the challenge: how do you map and sum a list of integers in one go?

### the full imperative vibe

One way to do it would be,

```haskell
mapSum1 :: Num a => (a -> b) -> [a] -> (a, [b])
mapSum1 f xs = foldr (\x (tot, ys) -> (tot + x, f x : ys)) (0, []) xs
```

Looks familiar? It's our old friend keep-the-state-on-the-side.

Even with this simple example, it's obvious that using a tuple is noisy. Now we have grokked `State`, it's time to introduce `mapM`: the "stateful" `map`.

```haskell
mapSum2 f xs = mapM (\x -> do { tot <- getState; putState (tot + x); return (f x); }) xs

ghci> let (State f) = mapSum2 show [1..5] in f 0
(["1","2","3","4","5"],15)
```

Of course we've come too far to not also introduce `modifyState`.

```haskell
modifyState :: (s -> s) -> State s ()
modifyState f = do
    s <- getState
    putState (f s)

mapSum3 f xs = mapM (\x -> do { modifyState (+ x); return (f x); }) xs
ghci> let (State f) = mapSum3 show [1..5] in f 0
(["1","2","3","4","5"],15)
```

Still with me? Congratulations, you can now write JavaScript in Haskell.
