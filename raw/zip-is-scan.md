The charm and humour of Haskellers is evident from "hello world": except it's not really your usual "hello world", but the fibonacci sequence. Take a look at this stellar [list of genius](https://wiki.haskell.org/The_Fibonacci_sequence)!

Limited by my level of talent, my favourite has always been the version with `zipWith`,

```Haskell
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)
```

Which is followed by two implementations with `scanl`,

```Haskell
fibs = scanl (+) 0 (1:fibs)
fibs = 0 : scanl (+) 1 fibs
```

Notice how `fibs` is used recursively for its own definition? Crazy right? This works because of lazy evaluation, a quality at the very core of Haskell.

I never paid much attention to the close proximity in the placement of these examples, but this week while going through the CryptoPals challenges with my gifted colleagues at Atlassian, I accidentally came to the realisation there might be an equivalence between `zipWith` and `scanl`; specifically, `scanl` can be written in terms of `zipWith` as follows,

```Haskell
scanlz :: (a -> b -> a) -> a -> [b] -> [a]
scanlz f z0 xs = let zs = z0 : zipWith f zs xs in zs
```

If I may also steal the test cases for `scanl` right from [here](https://hackage.haskell.org/package/base-4.19.0.0/docs/src/GHC.List.html#scanl), the results are exact matches.

```Haskell
ghci> scanlz (+) 0 [1..4]
[0,1,3,6,10]
ghci> scanlz (+) 42 []
[42]
ghci> scanlz (-) 100 [1..4]
[100,99,97,94,90]
ghci> scanlz (\reversedString nextChar -> nextChar : reversedString) "foo" ['a', 'b', 'c', 'd']
["foo","afoo","bafoo","cbafoo","dcbafoo"]
ghci> take 10 (scanlz (+) 0 [1..])
[0,1,3,6,10,15,21,28,36,45]
ghci> take 1 (scanlz undefined 'a' undefined)
"a"
```

The intriguing thing is `scanz` seems to be updating `zs` along each invocation of `f`, as would be the case with impure implementations such as `zs.append(f(z, x))`. This is actually not too far from the facts: the result of `f(z, x)` is indeed appended to `zs` just in the nick of time, not through mutation, but lazy evaluation of the "thunk" created by `zipWith`.

Equational reasoning helps us unfailingly in such tricky situations. We can follow the execution of `zipWith` and `f` by finding the parameter values: for the first iteration of `zipWith f zs xs`, `f` will receive the first `x` and `z0` (because it's the "head" of `zs`); the result `z1` becomes the second element of `zs`, and is fed into the second iteration, so on and so forth.

Words may fail but digrams less likely so, and this typical illustration of `fold`, with a bit of harmless alignment, shows us how close it is to `zip`!

![zip is scan](https://s3.ap-southeast-2.amazonaws.com/hacklewayne.com/zip-is-scan.png)

Needless to say, for what could have been obvious to more seasoned Haskellers, I am pleased with this finding through my own exploration.