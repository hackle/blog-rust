A friend asked me about the `State` Monad. He enjoyed a honey-moon with Monads such as `Maybe`, `List` and `Either`, but `State` appears to be next-level. It brings non-local states, it encodes a function, and often appears to be dark magic. 

So I tried to find him a good introduction, and got myself mighty confused in the process - such is the curse of Monad tutorials!

But `State` is nothing more than good ol' currying and partial application with a flourish. So here comes a very special introduction for those who are already comfortable with the idea of Monads, are not scared of type signatures, and don't like beating around the bush with motivational examples.

This leaves me an audience of about 10 people, so I'll get right to it.

## (State s a) type by type

```haskell
-- take a simple function
(a -> b)
-- we can add state s to the side to simulate a "stateful" computation
(a, s) -> (b, s)

-- what about function composition? (Note: this is pre-composition for convenience)
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

Note this is not a proof, but an intuition built with transformation of types step-by-step, from function composition to Monad composition.

Finding this a bit dense? No worries, I've got some examples anyway.

## the JavaScript envy

Imagine a stateful function in a language more "free" with mutation, such as JavaScript

```typescript
const greetings = [ "Hello", "Howdy", "Hi", "G'day" ];

// this is the stateful part
let index = 0;

function greet(name: string): string {
    return greetings[index++];  // I am leaving out boundary check for clarity
}

console.log(greet("Hackle"));
> Hello Hackle
console.log(greet("Hackle"));
> Howdy Hackle
```

See how the state `index` is messing with the `greet` function, so it's indeterministic?

It we try to translate it to Haskell,

```haskell
greetings = [ "Hello", "Howdy", "Hi", "G'day" ]
index = 0

type Name = String
type Greeting = (String, Name) -- why not a string? See below.

greet :: Name -> Greeting
greet name = (greetings !! index, name)
```

(A small note, I use `(String, Name)` instead of concatenating to a single `String`, to avoid getting two `String`s mixed up in the steps to come.)

Just one problem - there is no easy way to mutate `index`. So a direct translation from JavaScript is a no-go. What can we do? 

### Keep the state on the side

Let's try again in the Haskell way. We are going to keep the "state" on the side, as, passing it around as an extra parameter.

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

Some of my friends do what I call "double greeting" - instead of simply saying "hello Hackle!", they go "Hi Hackle, G'day!". Let's model that with function `doubleGreetS`, which turns a `Greeting` into a `DoubleGreeting`. (Again, I use a 3-tuple instead of a plain `String` to avoid confusion).

```haskell
type DoubleGreeting = (String, Name, String)

doubleGreetS :: (Greeting, GState) -> (DoubleGreeting, GState)
doubleGreetS ((greeting, name), st) = ((greeting, name, greetings !! st), st + 1)

ghci> doubleGreetS (("Hello", "Hackle"), 1)
(("Hello","Hackle","Howdy"),2)
```

We see the input to `doubleGreetS` matches the output of `greetS`, so let's create a `composeS` that stitches them together.

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

Experienced Haskellers would immediately point out `composeS` is just `.` in disguise! Keep this in mind. We will continue to work on the more verbose `composeS` signature, but the aim is to arrive at something comparable to `.`. 

### Stunt 1: currying!

Watch out - I am going to pull a stunt! 

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

Oh well, I exaggerate. It's simply a routine transformation: currying + partial application. And by "partial application" I really just mean adding `()`.

(Also I am leaving out the updates to the implementation of `composeS` as an exercise for the reader.)

As simple as the "stunt" is, it does surface something interesting - A pattern is winking at us, if we quint a bit: `a -> (s -> (b, s))`. Try to find it yourself!

With this finding, we can generalise the last type to,

```haskell
    (a -> (s -> (b, s)))
->  (b -> (s -> (c, s)))
->  (a -> (s -> (c, s)))
```

Remember `s` stands for "State"? Looking at this re-organised type, we will further notice the repetition in `s -> (?, s)`. Indeed, this is the key to our topic at hand.

### The State Monad: an underwhelming introduction

As developers do, when there is repetition, we create a type. In this case, smart people figured out that we can create the famous `State` type. Behold!

```haskell
newtype State s a = State (s -> (a, s))
```

(Note `a` is polymorphic - so is `s` for that matter - it can be any type, `String`, `Int`, or `b`, `c`).

With the tedious lead-up, this may appear underwhelming. But if you have tried other introductions that start with this type, it's fair to say, `s -> (a, s)` is not made for fast digestion. 

Let's hold the celebration just yet. Try answer this: what's the intuition for `s -> (a, s)`? 

A naive interpretation is, a value of type `a` can be computed from state `s`, like turning `String` to `Int` with `read`. While this can be the case for some use of `State`, it's not always true, and does not necessarily have to be so. 

The more sophisticated interpretation, is the function `s -> (a, s)` has the "knowledge" of producing an `a`. How is that possible? Why, I am surprised you'd ask! One way is **partial application**, which we've just seen so much of!

In our example, `a -> s -> (b, s)` can be partially applied with `a`, to leave us `s -> (b, s)`. Ta da.

To continue the work on the types, let's slot in `State s a` (again, `a` is polymorphic so it can be `b` or `c`!)

```haskell
    (a -> State s b)
->  (b -> State s c)
->  (a -> State s c)
```

Already much easier on the eye, wouldn't you say? At least we saved 2 layers of `()`.

If you try to catch up with the implementation, there would be a fair bit of wrapping and unwrapping with `State` being `newtype`; but if we focus only on the composition, it should remind us of monad composition. Presumed we can prove `State` is a monad, the above types can be generalised to, 

```haskell
    (a -> m b)
->  (b -> m c)
->  (a -> m c)
```

Hello, it's none other than the fish operator `>=>`, or the "Kleisli arrow"! According to [hoogle](https://hoogle.haskell.org/?hoogle=%28a+-%3E+m+b%29+-%3E++%28b+-%3E+m+c%29+-%3E++%28a+-%3E+m+c%29&scope=set%3Astackage).

Before it's too late, we need to implement the monad type class. Luckily this is straightforward (try it out yourself!). Below is a very naive version.

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

First, it prompts the refactoring below. I've suffixed the names with `M` to indicate the monad usage.

```haskell
greetM :: Name -> State GState Greeting
greetM name = State $ \st -> ((greetings !! st, name), st + 1)

doubleGreetM :: Greeting -> State GState DoubleGreeting
doubleGreetM (greeting, name) = State $ \st -> ((greeting, name, greetings !! st), st + 1)

highGreetM = greetM >=> doubleGreetM

ghci> let (State f) = highGreetM "Hackle" in f 0
(("Hello","Hackle","Howdy"),2)
```

You'll notice the immediate consequence of currying and partial application: what we used to supply in one go for `highGreet ("Hackle", 0)` is now done in two steps, 
1. first, `"Hackle"` is given to the monad-powered `highGreetM`, which returns a `State`-monad value that encodes a partially-applied function `s -> (a, s)`, which
2. accepts the second parameter `0`, to complete the computation, and give us the same result as the non-monad-powered `highGreet`!

Despite the small win that the function types are more revealing by indicating state usage alongside return type, let's be honest, this consequence does not improve the life of the caller, and it's arguable if the implementation of `greetM` or `doubleGreetM` is any simpler. (I hear you, it's fun to use the "fish" operator). Not to forget, this is still a far cry from the "beauty" of the JavaScript code.

That's fair! I am not offended, because we aren't done yet! After all, how could "statefulness" be claimed without `putState` and `getState`?! Behold...

### Stunt 2: getter and setter

The famous `getState` is defined as,

```haskell
getState :: State s s
getState = State $ \s -> (s, s)
```

You can see `State s s` is just a clever trick - if `State s a` can have any `a`, why not `s` to make it `State s s`?

Standalone, `getState` looks pretty silly. However, taken in the context of monad composition, it's nothing short of genius, because it allows us to grab the state out of thin air.

`putState` is reminiscent of the imperative "setter" that sets the state and returns `void`.

```haskell
putState :: s -> State s ()
putState s = State $ \_ -> ((), s) 
```

Not much is happening - it ignores any previous **state** with `_`, and sets up a void-like `()`. The only useful thing it does is putting an `s` in the second position of a tuple. This is key - have a look at the `>>=` definition, you'll see how this is enough to achieve the goal of "updating" the state (for any following `State`-monad values). 

Now our example looks suspiciously *familiar*,

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