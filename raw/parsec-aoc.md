["Advent Of Code"](https://adventofcode.com/) is a lot of fun! To me, in no small part it's due to parsing, particularly when combining a few list functions doesn't cut it. 

Of course, this should be done with Parsec (or its comparable), not regular expressions, yikes.

Let's start with a simple example, the input for the [day 4 challenge, "Camp Cleanup"](https://adventofcode.com/2022/day/4).

```
2-4,6-8
2-3,4-5
5-7,7-9
2-8,3-7
6-6,4-6
2-6,4-8
```

Sure, this would be done simply with something like `bimap (splitOn '-') (splitOn '-') (splitOn ',' "2-4,6-8")` barring any smarter concoctions that are destined to exist in abundance. Or, if we use `Parsec`.

```haskell
type Range = (Int, Int)
type Parser a = Parsec String () a  -- and alias to save us some typing

int :: Parser Int
int = read @Int <$> many1 digit

around :: Parser a -> Parser b -> Parser (a, a)
around p sep = do
    r1 <- p
    sep
    r2 <- p
    return (r1, r2)

range :: Parser Range
range = int `around` (char '-')

rangePair :: Parser (Range, Range)
rangePair = range `around` (char ',')

pairs :: Parser [(Range, Range)]
pairs = rangePair `sepBy1` endOfLine
```

(There is small problem with ``rangePair `sepBy1` endOfLine`` that's not immediately obvious, read on!)

A reasonable first response would be: this is a lot of code, even with the type annotation stripped away!

However, due to the compositional nature of parser combinators, one of the obvious advantages is how structured the code looks like: ``range = int `around` (char '-')`` leaves nothing to confusion. It's not hard to see such clarity can be vital in dealing with more complex input, such as the [Day-7 challenge "No Space Left On Device"](https://adventofcode.com/2022/day/7)


```
$ cd /
$ ls
dir a
14848514 b.txt
8504156 c.dat
dir d
$ cd a
$ ls
dir e
29116 f
2557 g
62596 h.lst
$ cd e
$ ls
584 i
$ cd ..
$ cd ..
$ cd d
$ ls
4060174 j
8033020 d.log
5626152 d.ext
7214296 k
``` 

This really justifies the use of a proper parser library such as `Parsec` for its dreaded statefulness, which would be a handful for any (especially) smart regular expressions.

Luckily this was not a problem as `Parsec` incorporates `State`, so I could `getState`, `putState` or `modifyState` pretty conveniently. Quite the power tool. 

However, the problem I ran into was not that advanced, although quite infamous. When parsing the commands such as  `$ ls` or `$ cd ..`, my code looks like this,

```haskell
cd = do
    string "$ ls" <* endOfLine
    -- ... puState for current paths
ls = do
    string "$ ls" <* endOfLine
    (file <|> dir) `sepBy` endOfLine    -- problematic!

command = ls <|> cd
```

When parsing the CLI output above, this parser gives the following error,

```haskell
Left (line 7, column 1):
unexpected '$'
expecting digit, "dir ", new-line or end of input
```

a.k.a. the dreaded "back-tracking" problem, but how?

## Back-Tracking

We'll take it from the top again, with a happy-path parser.

```haskell
ghci> parse (string "abc" <> string "def") "(any source)" "abcdef"
Right "abcdef"
```

For "either / or" situations, the `<|>` combinator is handy.

```haskell
ghci> parse (string "abc" <|> string "def") "(any source)" "def"
Right "def"
```

Then it gets interesting: what if two parsers share the same prefix, such as `"alice" and "alba"`?

```haskell
ghci> parse (string "alice" <|> string "alba") "(any source)" "alba"
Left (line 1, column 1):
unexpected "b"
expecting "alice"
```

Ah, we get an error, which is confusing - the code clearly instructs to "parse either an 'alice' or an 'alba'", but it fails as soon as "alice" fails, without trying "alba". This is not how "or" normally works. How come?

This has to do with how `Parsec` *consumes* input *char by char*. For `string "alice"`, it consumes `"al"`, and fails at `'b'`; despite its "or" semantics, `<|>` does not back-track to the beginning for `"alba"`. Like many, I found this baffling if not also frustrating.

This creates the need for "back-tracking", for the parser to go back by two letters and parse `"alba"` from the beginning. To tell `Parsec` to do that, we use `try`. 

```haskell
ghci> parse (try (string "alice") <|> string "alba") "(any source)" "alba"
Right "alba"
```

`try (string "alice")` will not *consume* any input in the case of failure, it starts over for `string "alba"` by going *backwards*, hence "back-tracking".

This behaviour may also be described as "to tell `Parsec` to *undo* parsing `string "alice"`". However I find this view imperative, and does not accurately reflect how `try` (or parser combinators in general) works. More of this at the end.

## Shared Separator

This issue may lay in ambush. For example, separators. 

Again we start with the happy path: digits separated by commas. `sepBy` seems the perfect combinator for this scenario.

```haskell
ghci> parse (digit `sepBy` char ',') "(any source)" "1,2,3,9"
Right "1239"
```

Pretty intuitive stuff. What about "comma-separated digits followed by letters"?

```haskell
ghci> parse (digit `sepBy` char ',' <> letter `sepBy` char ',') "(any source)" "1,2,3,9,a,b,c,d"
Left (line 1, column 9):
unexpected "a"
expecting digit
```

It took me a fair bit of head scratching to figure out this is the same "back-tracking" issue, only this time the perpetrator is `sepBy`. After *consuming* `9`, `parse` goes on to eat up `,` happily, which is specified as the separator. Fair and square! However, by the time it reaches `a` and fails, it's "too late"!

Put differently, my choice of parsers results in *ambiguity*: `char ','` is used as separator for two consecutive sequences, one of digits and another of letters.

How do we tell `Parsec` to back out of its greedy behaviour? 

`try` is no good here because we need both `digit`s and `letter`s; one workaround is to combine `letter` and `digit`, but it allows digits and letters to arrive out of order.

```haskell
ghci> parse ((digit <|> letter) `sepBy` char ',') "(any source)" "1,2,3,9,a,b,c,d"
Right "1239abcd"
ghci> parse ((digit <|> letter) `sepBy` char ',') "(any source)" "1,a,2,b,3,c,9,d"
Right "1a2b3c9d"    -- out of order, not what we want
```

Or there is `optional`, according to the [documentation](https://hackage.haskell.org/package/parsec-3.1.15.1/docs/Text-Parsec.html#optional),

> optional p tries to apply parser p. It will parse p or nothing. It only fails if p fails after consuming input. It discards the result of p.

```haskell
ghci> parse (many (digit <* optional (char ',')) <> many (letter <* optional (char ','))) "(any source)" "1,2,3,9,a,b,c,d"
Right "1239abcd"
```

Hurrah! Although there is still a catch...

## Optional, one and only 

I am terrible at RTFM but the description of `optional` does scare me a little.

> It only fails if p fails after consuming input.

Indeed, `optional` can still lead to back-tracking problems. If the separator is more than one character, such as `->`, then failure at the second character spells trouble. 

```haskell
ghci> parse (many (digit <* optional (string "->")) <> many (letter <* optional (string "->"))) "" "1->2->3->9->a->b->c->d"Right "1239abcd"

ghci> parse (many (digit <* optional (string "->")) <> string "-" <>  many (letter <* optional (string "->"))) "" "1->2->3->9-a->b->c->d"
Left (line 1, column 11):
unexpected "a"
expecting "->"
```

See what trips it up? It's the `-` between the digits and letters. `Parsec` will try to get a `->` but fails after `-`, back-tracking required! 

Applying the `try` trick fixes the problem.

```haskell
ghci> parse (many (digit <* optional (try (string "->"))) <> string "-" <>  many (letter <* optional (string "->"))) "" "1->2->3->9-a->b->c->d"
Right "1239-abcd"
```

Verbosity is the price we pay for precision and clarity. Of course, any code suited more than the REPL should be formatted for better reading experience.

## Don't "try" too hard

It would be obvious but worth calling out, using "try" too liberally will not only result in noisy code and confusing errors, but also performance issues. Consider,

```haskell
ghci> parse (try (string "Hello World!") <|> string "Hello Space!") "(any source)" "Hello Space!"
Right "Hello Space!"
```

Beautiful when it works, and when it doesn't? Utter confusion.

```haskell
ghci> parse (try (string "Hello World!") <|> string "Hello Space!") "(any source)" "Hello Spase!"   -- spa(s)e
Left (line 1, column 1):
unexpected "s"
expecting "Hello Space!"
```

The error message includes the whole string in `expecting "Hello Space!"`, it could take some eye-balling to find where exactly the parser fails (at letter `"s"`). People may blame `Parsec` for the inaccurate error message, but really, I am to blame for making ambiguous parsers!

*Ambiguity* arises when `"Hello World!" <|> "Hello Space!"` share the prefix `"Hello "`, but if we shuffle the words around, it needs not necessarily be the case: `"Hello " <> (World!" <|> "Space!")`.

Using the knowledge to my advantage, `try` isn't even needed!

```haskell
ghci> parse (string "Hello " <> (string "World!" <|> string "Space!")) "(any source)" "Hello Space!"
Right "Hello Space!"

ghci> parse (string "Hello " <> (string "World!" <|> string "Space!")) "(any source)" "Hello Spase!"
Left (line 1, column 7):
unexpected "s"
expecting "Space!"
```

Granted, the error message is still not accurate to the letter, but at least it's more localised to "spase".

The lesson learned: design the parsers around *ambiguity*, and use `try` judiciously, maybe only as the last resort.

## What back-tracking?

How does `try` work exactly? I mentioned previously there is no imperative operation such as "undo" or "putting characters back to the input". But how else could it be?

The definition of `try` can be found [here](https://hackage.haskell.org/package/parsec-3.1.15.1/docs/src/Text.Parsec.Prim.html#try)

```haskell
try :: ParsecT s u m a -> ParsecT s u m a
try p =
    ParsecT $ \s cok _ eok eerr ->  -- note the suspicious _
    unParser p s cok eerr eok eerr  -- eerr is used twice, first time in the position of _, what is eerr?
```

Whereas `ParsecT` is quite a handful, pay attention to the comments,

```
newtype ParsecT s u m a
    = ParsecT {unParser :: forall b .
                 State s u
              -> (a -> State s u -> ParseError -> m b) -- consumed ok
              -> (ParseError -> m b)                   -- consumed err
              -> (a -> State s u -> ParseError -> m b) -- empty ok
              -> (ParseError -> m b)                   -- empty err
              -> m b
             }
```

Do you see it? A pretty neat trick - `try` will ignore any "consumed err" and replace it with "empty err", which by the name does not *consume* any input. Nothing is "put back"; the parser being tried (`p` in `try p`) is simply ignored.

## Reference

* [Parsec: “try a <|> b” considered harmful, Edward Z. Yang](http://blog.ezyang.com/2014/05/parsec-try-a-or-b-considered-harmful/)