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

It's easy to get started too, we just pick any silly little function. Imagine this in an imperative language.

```typescript
let greetings = [ "Hello", "Howdy", "Hi", "G'day" ];
// this is the stateful part
let index = 0;

function greet(name: string): string {
    return greetings[index++ % greetings.length];
}

console.log(greet("Hackle"));
> Hello Hackle
console.log(greet("Hackle"));
> Howdy Hackle
```

This can be translated to Haskell as below.

```haskell
greetings = [ "Hello", "Howdy", "Hi", "G'day" ]
index = 0

type Name = String
type Greeting = (String, Name) -- why not a string? See below.

greet :: Name -> Greeting
greet name = (greetings !! index, name)
```

(A small note, for differentiation, I use `(String, Name)` instead of concatenating them to a single `String` as in JavaScript, e.g. `greetings !! index ++ name`. This is to avoid getting two `String`s mixed up in the steps to come.)

Just one problem - there is no easy way to mutate `index`. But we REALLY like the ease of mutation in the JavaScript version. How? 

### Keep the state on the side

It's always good to start simple. We are going to keep the state on the side - passing it around as an extra parameter.

```haskell
-- I am going to call it "state" now to suit the narrative :-)
type GState = Int

greetS :: (Name, GState) -> (Greeting, GState)
greetS (name, st) = ((greetings !! st, name), st + 1)

ghci> greetS ("Hackle", 0) 
(("Hello","Hackle"),1)

ghci> let (greeting, st) = greetS ("Hackle", 0) in [greeting, fst $ greetS("Hackle", st)]
[("Hello","Hackle"),("Howdy","Hackle")]
```

This simulates a stateful function, but syntax-wise, it's annoying to thread the state through, and just not as sweet as JavaScript! Can we do better?

### Composition

Many people do what I call "double greeting" - instead of simply saying "hello Hackle!", they go "Hello Hackle, How are you today?". Let's model that as a function `doubleGreetS`, which turns a `Greeting` into a `DoubleGreeting`. (Remember they are just 2-tuple and 3-tuple respectively).

```haskell
type DoubleGreeting = (String, Name, String)

doubleGreetS :: (Greeting, GState) -> (DoubleGreeting, GState)
doubleGreetS ((greeting, name), st) = ((greeting, name, greetings !! st), st + 1)

ghci> doubleGreetS (("Hello", "Hackle"), 1)
(("Hello","Hackle","Howdy"),2)
```

We see the input to `doubleGreetS` matches the output of `greetS`, so let's create a generic `composeS` that composes them.

```haskell
composeS 
    :: ((Name, GState) -> (Greeting, GState)) 
    -> ((Greeting, GState) -> (DoubleGreeting, GState)) 
    -> ((Name, GState) -> (DoubleGreeting, GState))
composeS f1 f2 = 
    \(a, st) -> 
        let (b, st1) = f1 (a, st) 
        in f2 (b, st1)

highGreet :: (Name, GState) -> (DoubleGreeting, GState)
highGreet = composeS greetS doubleGreetS

ghci> highGreet (("Hackle"), 0)
(("Hello","Hackle","Howdy"),2)
```

Experienced Haskellers would immediately point out `composeS` is just `.` in disguise! This is true and please note it down. We will keep working on the `composeS` signature, to arrive at something comparable to `.`. 

### Stunt 1: currying!

Watch out - I am going to pull a stunt! 

Oh well, I exaggerate, it's only 2 steps from the `composeS` type: currying + partial application. And by "partial application" I really just mean adding `()`.

```haskell
composeS 
::  ((Name, GState)     -> (Greeting, GState)) 
->  ((Greeting, GState) -> (DoubleGreeting, GState)) 
->  ((Name, GState)     -> (DoubleGreeting, GState))

-- currying
    (Name       -> GState -> (Greeting, GState)) 
->  (Greeting   -> GState -> (DoubleGreeting, GState)) 
->  (Name       -> GState -> (DoubleGreeting, GState))

-- partial application, notice the pattern?
    (Name       -> (GState -> (Greeting, GState)))
->  (Greeting   -> (GState -> (DoubleGreeting, GState)))
->  (Name       -> (GState -> (DoubleGreeting, GState)))
```

I am making a big fuss about it, but really, it's simply the result of currying + adding `()`. I am leaving out the updates to the implementation of `composeS` as an exercise for the readers.

What's interesting - A pattern is winking at us, if we quint a bit: `a -> (s -> (b, s))`! This is the generalised form of the last type,

```haskell
    (a -> (s -> (b, s)))
->  (b -> (s -> (c, s)))
->  (a -> (s -> (c, s)))
```

Remember `s` stands for "State"? Looking at this re-organised type, we will further notice the gaping repetition in `s -> (?, s)`. Indeed, this is the key to our topic at hand.

### The State Monad: an underwhelming introduction

As developers do, when there is repetition, we create a type. In this case, smart people figured out that we can create the famous `State` type. Behold!

```haskell
newtype State s a = State (s -> (a, s))
```

(Note `a` is polymorphic - so is `s` for that matter - it can be any type, `String`, `Int`, or `b`, `c`).

With the tedious lead-up, this may appear underwhelming. But if you have tried other introductions that start with this type, it's fair to say, `s -> (a, s)` is not made for fast digestion. 

Let's hold the celebration just yet. Try answer this: what's the intuition for `s -> (a, s)`? 

A naive interpretation is, a value of type `a` can be computed from state `s`, like turning `String` to `Int` with `read`. While this can be the case for some use of `State`, it's not always true, and does not necessarily have to be so. 

The more sophisticated interpretation, is the function `s -> (a, s)` has the "knowledge" of producing an `a`. How is that possible? Why, I am surprised you'd ask, because of none other than **currying**, which we've just seen so much of!

To continue working on the types, let's slot in `State s a` (again, `a` is polymorphic so it can be `b` or `c`!)

```haskell
    (a -> State s b)
->  (b -> State s c)
->  (a -> State s c)
```

Already much easier for the eyes, wouldn't you say? At least we saved 2 layers of `()`.

If you try to catch up with the implementation, there would be a fair bit of wrapping and unwrapping; but if we focus only on the type, it should remind us of monad composition. Presumed we can prove `State` is a monad, the above types can be generalised to, 

```haskell
    (a -> m b)
->  (b -> m c)
->  (a -> m c)
```

Hello, it's none other than the fish operator `>=>`, or the Kleisli arrow! According to [hoogle](https://hoogle.haskell.org/?hoogle=%28a+-%3E+m+b%29+-%3E++%28b+-%3E+m+c%29+-%3E++%28a+-%3E+m+c%29&scope=set%3Astackage).

Before it's too late, we need to implement the monad class. Luckily this is straightforward (try it out yourself!). Below is a very naive version.

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

So `State s` is a proper monad, bravo! What does that mean for the example? 

It certainly prompts the refactoring below. I've suffixed the names with `M` to indicate the monad usage.

```haskell
greetM :: Name -> State GState Greeting
greetM name = State $ \st -> ((greetings !! st, name), st + 1)

doubleGreetM :: Greeting -> State GState DoubleGreeting
doubleGreetM (greeting, name) = State $ \st -> ((greeting, name, greetings !! st), st + 1)

highGreetM = greetM >=> doubleGreetM

ghci> let (State f) = highGreetM "Hackle" in f 0
(("Hello","Hackle","Howdy"),2)
```

You'll notice the immediate consequence of using "currying": what we used to supply in one go for `highGreet ("Hackle", 0)` is now done in two steps, first, `"Hackle"` is given to the monad-powered `highGreetM`, which returns a `State` monad that encodes a partially-applied function `s -> (a, s)`, which accepts `0` and gives us the same result as the non-monad-powered `highGreet`!

Despite the small win that the function types are more revealing by indicating state usage alongside return type, let's be honest, this consequence does not improve the life of the caller, and it's arguable if the implementation of `greetM` or `doubleGreetM` is any simpler. (I hear you, it's fun to use the "fish" operator). Not to forget, this is still a far cry from the JavaScript version.

That's fair! I am not offended, because we aren't done yet! How could "statefulness" be claimed without `putState` and `getState`? Behold...

### Stunt 2: getter and setter

The famous `getState` is defined as,

```haskell
getState :: State s s
getState = State $ \s -> (s, s)
```

You can see `State s s` is just a smart trick - if `State s a` can have any `a`, why not `s` to make it `State s s`?

Standalone, `getState` looks pretty silly. However, taken in the context of monad composition, it's nothing short of genius, because it allows us to grab the state out of thin air.

`putState` is reminiscent of the imperative "setter" that sets the state and returns `void`.

Now our example looks properly different,

```haskell
greetM' :: Name -> State GState Greeting
greetM' name = do
    st <- getState
    putState (st + 1)
    return (greetings !! st, name)

doubleGreetM' :: Greeting -> State GState DoubleGreeting
doubleGreetM' (greeting, name) = do
    st <- getState
    putState (st + 1)
    return (greeting, name, greetings !! st)
```

Are you getting the imperative vibe? (I must admit seeing the `putState` and `return` "statements" does give me creeps!)

Compare this to `greetM`, see how state handling is offloaded to `getState` and `putState`, and separate from building the *greeting*? Pretty neat!

### the full imperative vibe

The imperative feel doesn't stop here. Consider this challenge: how do you map and sum a list of integers in one go?

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

## Acknowledgement

Many thanks to [Utku Demir](https://utdemir.com/) for the comprehensive and on-point review.