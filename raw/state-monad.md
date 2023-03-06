A friend asked me about the `State` Monad. He enjoyed a honey-moon with Monads such as `Maybe`, `List` and `Either`. In trying to find a good introduction, alas, I got mighty confused myself - such is the curse of Monad tutorials!

But `State` is nothing more than good ol' currying with a flourish. So here comes a very special introduction for those we are already comfortable with the idea of Monads, are not scared of type signatures, and don't like wasting time with motivational examples that takes it from the top.

This leaves me a very limited audience, so I'll get right to the point. 

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
== (>=>)    -- "Kleisli arrow" from Control.Monad
== (>>>)    -- Control.Arrow
```

Note this is an intuition, not a proof. The intuition is build with step-by-step transformation of types, from function composition to Monad composition.

## From types to example

Now let's do the opposite of what most tutorials do: create an example from the above types.

Alas, finding a good example is harder than finding the intuition! Luckily, we can always fall back to parsers.

```haskell
-- pick a function
charToInt :: Char -> Int
charToInt c = read [c]
```

### Add an evil state

Now we add a state to this computation. There can be a million reasons to add a state. Sometimes the state influences the computation, sometimes not. The state can also be written to, or/and read from.

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

## Composition

There is nothing wrong with passing the state around, in fact, it should be encouraged over implicit states. However, it can go a bit far.

I'll use a silly `intToList` to help us draw a comparison.

```haskell
intToList :: Int -> [Int]
intToList n = [n]

charToIntList :: Char -> [Int]
charToIntList = intToList . charToInt

ghci> charToIntList '2'
[2]
```

With a state, it's the same idea. (Never mind the implementation of `intToListS`, as long as you get the idea that it's "stateful".)

```haskell
intToListS :: (Int, EvilState) -> ([Int], EvilState)
intToListS (n, s) = let s1 = n * s in ([s1], s1)

charToIntListS :: (Char, EvilState) -> ([Int], EvilState)
charToIntListS = intToListS . charToIntS

ghci> charToIntListS ('2', 3)
([12],12)
```

However, it does get unwieldy as more and more functions have to use state. Sometimes, a function itself does not need the state, but if it uses a function that needs to access the state, then the "parent" function must use this `(a, State) -> (b, State)` type too. 

How do we get out of this? 

## Stunt 1: currying!

Watch out - I am going to pull a stunt! Oh well, I exaggerate, it's only 2 steps: currying + partial application. 
By "partial application" I really just mean putting `()` around `EvilState -> (Int, EvilState)`.

```haskell
((Char, EvilState) -> (Int, EvilState))         -- charToIntS
-> ((Int, EvilState) -> ([Int], EvilState))     -- intToListS
-> ((Char, EvilState) -> ([Int], EvilState))    -- charToIntListS

-- currying
   (Char -> EvilState -> (Int, EvilState))         
-> (Int  -> EvilState -> ([Int], EvilState))     
-> (Char -> EvilState -> ([Int], EvilState))    

-- partial application, note pattern?
   (Char -> (EvilState -> (Int, EvilState)))         
-> (Int ->  (EvilState -> ([Int], EvilState)))     
-> (Char -> (EvilState -> ([Int], EvilState)))   
```

Did you see the pattern `a -> (s -> (b, s))`? I am making a big fuss about it, but really, it's simply the result of currying + adding `()`. You may give it a try, but updates to the implementation should be routine.

As developers do, when there is repetition, we create a type for it. In this case, smart people figured out that we can create the famous `State` type.

## The State Monad: an underwhelming introduction

```haskell
newtype State s a = State (s -> (a, s))
```

With which the above types can be rewritten as,

```haskell
   (Char -> (State EvilState Int))         
-> (Int ->  (State EvilState [Int]))     
-> (Char -> (State EvilState [Int]))
```

This adds wrapping and unwrapping to the implementation, but if we only focus on the types, they should remind you of monad composition. Indeed, 

```haskell
    (a -> m b)
->  (b -> m c)
->  (a -> m c)
```

Is none other than the fish operator `>=>`, or the Kleisli arrow, according to [hoogle](https://hoogle.haskell.org/?hoogle=%28a+-%3E+m+b%29+-%3E++%28b+-%3E+m+c%29+-%3E++%28a+-%3E+m+c%29&scope=set%3Astackage).

We still need to write the monad implement, which luckily is straightforward (or even boring if you bothered to update the implementation for each step). Below is a very naive version.

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

With this we can now rewrite our "stateful" functions.

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

Great, we know `State s` works as a monad, but alas, we have not made it any simpler except getting to use the "fish" operator over the less fancy `.`. We still handle the state pretty manually.

That's quite right - we are still missing `putState` and `getState` to simulate imperative state manipulation.  The second stunt!

## State: get and set

We use `getState` to grab the state from the current "context". It's defined as,

```haskell
getState :: State s s
getState = State $ \s -> (s, s)

currentState :: State s s
currentState = do
    st <- getState
    return st
```

Why `State s s`? Because monads bind `>>=` is done through the last type parameter in `State s a`.

`putState` is reminiscent of an imperative operation that "sets" the state and returns `void`. Of course in Haskell `void` is quite a different beast, so we use `()`.

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

But the imperative feel does not stop here. Let me give you another example: how do you map and sum a list of integers in one go?

## get the full imperative vibe

One way to do it would be,

```haskell
mapSum1 :: Num a => (a -> b) -> [a] -> (a, [b])
mapSum1 f xs = foldr (\x (tot, ys) -> (tot + x, f x : ys)) (0, []) xs
```

But even with this simple example, it's annoying to have to use a tuple, which usually trigger the alarms in my brain. Now we have grokked `State`, let's see `mapM`.

```haskell
mapSum2 f xs = mapM (\x -> do { tot <- getState; putState (tot + x); return (f x); }) xs

ghci> let (State f) = mapSum2 show [1..5] in f 0
(["1","2","3","4","5"],15)
```

Of course we can go a step further and introduce `modifyState`.

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
