When taking part in this year's "Advent Of Code", a lot of fun (or pain depending) comes from parsing, particularly when combining a few list functions don't cut it. 

Of course, this should be done with Parsec, not regular expressions, yikes.

Let's start with a simple example, with input for the day 4 challenge.

```
2-4,6-8
2-3,4-5
5-7,7-9
2-8,3-7
6-6,4-6
2-6,4-8
```

This would be done simply with something like `bimap (splitOn '-') (splitOn '-') $ bimap (splitOn ',')`. Using Parsec would look like this.


```haskell
type Range = (Int, Int)
type Parser a = Parsec String () a

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

A reasonable first response is - this is a lot of code, even with the type annotation stripped away!

However, due to the compositional nature of parser combinators, one of the obvious advantages is how structured the code looks like: ``range = int `around` (char '-')`` leaves nothing to be confused about.

It's not hard to see such clarity can be vital in dealing with more complex input, which we will see later.

Also - there is small problem with ``rangePair `sepBy1` endOfLine`` that's not immediately revealed.

The [Day-7] challenge really raises the challenge for parsing: it's stateful! Luckily this was not a problem as `Parsec` incorporates `State`, so I could `getState`, `putState` or `modifyState` pretty conveniently.

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

Stateful parsing is quite the power tool. With this challenge I ran into the infamous problem.

```
Left (line 7, column 1):
unexpected '$'
expecting digit, "dir ", new-line or end of input
```

As, the dreaded "back-tracking" problem!

## Back-Tracking

A happy-path parser works like this.

```haskell
ghci> parse (string "abc" <> string "def") "" "abcdef"
Right "abcdef"
```

For "either / or" situations, the `<|>` combinator is handy.

```haskell
ghci> parse (string "abc" <|> string "def") "" "def"
Right "def"
```

This is when it gets interesting: what if two parsers share the same prefix, such as `"alice" and "alba"`? Ah, we get the error,

```haskell
ghci> parse (string "alice" <|> string "alba") "" "alba"
Left (line 1, column 1):
unexpected "b"
expecting "alice"
```

This can be quite confusing - the code clearly instructs to "parse either an 'alice' or an 'alba'", but it fails as soon as it finds "alice" cannot be parsed. How come?

This has to do with how `Parsec` *consumes* input *char by char*. For `string "alice"`, it consumes `'a'`, and fails at `'b'`; despite its "or" semantics, `<|>` does not back-track to the beginning for `"alba"`. Like many, I find this baffling if not also frustrating.

To tell `Parsec` to start from the beginning, we can use `try`. 

```haskell
ghci> parse (try (string "alice") <|> string "alba") "" "alba"
Right "alba"
```

(Note this behaviour is alternatively phrased as to "tell `Parsec` to *undo* the attempt of parsing `string "alice"`", but this is an imperative view and is not accurate to how the parser combinators work.)

## Shared Separator

The issue was better disguised with separators. Again we start with the happy path: digits separated by commas. `sepBy` is the nice combinator.

```haskell
ghci> parse (digit `sepBy` char ',') "" "1,2,3,9"
Right "1239"
```

Pretty intuitive stuff. What about "commas-separated digits followed by letters"?

```haskell
ghci> parse (digit `sepBy` char ',' <> letter `sepBy` char ',') "" "1,2,3,9,a,b,c,d"
Left (line 1, column 9):
unexpected "a"
expecting digit
```

It took me a fair bit of head scratching to figure out that it's the same "back-tracking" issue, only this time the perpetrator is `sepBy`. After *consuming* `9`, `Parsec` goes on to eat up `,` happily, because it's specified as the separator, fair and square! However, by the time it reaches `a`, it's "too late"!

Put differently, my choice of parsers results in ambiguity: `char ','` is used as separator for two consecutive sequences, one of digits and another of letters.

How do we tell `Parsec` to back out of its greedy behaviour? 

`retry` is no good here because we need both `digit`s and `letter`s; one workaround is to combine `letter` and `digit`, but it allows digits and letters to arrive out of order.

```haskell
ghci> parse ((digit <|> letter) `sepBy` char ',') "" "1,2,3,9,a,b,c,d"
Right "1239abcd"
ghci> parse ((digit <|> letter) `sepBy` char ',') "" "1,a,2,b,3,c,9,d"
Right "1a2b3c9d"    -- out of order, not what we want
```

Luckily there is `optional`, according to the [documentation](https://hackage.haskell.org/package/parsec-3.1.15.1/docs/Text-Parsec.html#optional),

> optional p tries to apply parser p. It will parse p or nothing. It only fails if p fails after consuming input. It discards the result of p.

```haskell
ghci> parse (many (digit <* optional (char ',')) <> many (letter <* optional (char ','))) "" "1,2,3,9,a,b,c,d"
Right "1239abcd"
```

Hurrah! 

## There is a catch

I am terrible at RTFM but the description of `optional` does scare me a little, true enough, it's easy to get the same error if the separator is `->` rather than `,`.

```
ghci> parse (many (digit <* optional (string "->")) <> many (letter <* optional (string "->"))) "" "1->2->3->9->a->b->c->d"Right "1239abcd"

ghci> parse (many (digit <* optional (string "->")) <> string "-" <>  many (letter <* optional (string "->"))) "" "1->2->3->9-a->b->c->d"
```

See what trips it up? It's the `-` between the digits and letters. `Parsec` will try to get a `->` but would fail midway, and would not be able to back-track! 

Well, we need to bring back the `try` trick.

```haskell
ghci> parse (many (digit <* optional (try (string "->"))) <> string "-" <>  many (letter <* optional (string "->"))) "" "1->2->3->9-a->b->c->d"
Right "1239-abcd"
```

While I could argue the verbosity is the price to pay for precision, it is quite a lot of code. Of course this is in the REPL, in practice it should be formatted for a better reading experience.

