## TypeScript

Type Witness is probably not a fair ask to TypeScript, but I've always fancied this code to work.

First we have a `BagOfData`.

```TypeScript
type BagOfData<T extends any = unknown> = {
    data: T[],
    sample: T
};
```

Notice how `T` is generic but defaults to `unknown`, so it's possible to be any type. In other terms, we can create a heterogeneous list like so.

```TypeScript
const bags: BagOfData[] = [
    {
        data: ['merry', 'xmas'],
        sample: 'it is a string'
    },
    {
        data: [101, 555],
        sample: 3
    },
    {
        data: [],
        sample: true
    },
];
```

Notice how the last `bag` has an empty `data`? This is when `sample` becomes useful: it tells us what type `data` should be, even when it's empty.

In another term, `sample` bears witness to the type of `data`. Isn't this a great name!

But how do we use it? This is how I fancied it.

```TypeScript
function tryGetStrData(bag: BagOfData): string[] | null {
    if (typeof bag.sample === 'string') {
        // bag.sample : string
        return bag.data;    // error
    }

    return null;
}
```

> (property) data: unknown[]
> Type 'unknown[]' is not assignable to type 'string[]'.
> Type 'unknown' is not assignable to type 'string'.ts(2322)

You see, TypeScript is able to figure out `bag.sample` must be a `string` in the `if` block, logically, `bag.data` must be `string[]`, because they are supposed to be the same type by the definition of `BagOfData`!

This could be boiled down to a less fun, but simpler example.

```TypeScript
function guess<T extends any = unknown>(
    val1: T,
    val2: T
): string {
    if (typeof val1 === 'string') {
        return val2;    // error
    }

    return 'dunno';
}
```

Along the same lines, my logic,

1. `val1` and `val2` are of the same type
2. I've figured out `val1` is a `string`
3. `val2` must also be a `string`

Despite the flawless reasoning, TypeScript does not yet offer such support.

It's possibly unfair because it's high expectations for a mainstream language; but maybe it's a form of complement - TypeScript offers so much expressive power, people get carried away.

## Haskell

The above quiz has always been on my mind, but I got the idea first from Haskell (as on many other occasions). Although it was only recent that I re-read a great blog post from [Serokell](https://serokell.io/blog/haskell-type-level-witness) which clarifies and adds to [Haskell Wiki](https://wiki.haskell.org/Type_witness).

Now I could put it to work. This brings together a few strange ideas in Haskell!

### A type is hidden

Firstly, the `Bag` type is unlike the TypeScript version, it does not expose the type of data. (`WildList` defined below.)

```Haskell
data Bag where
  Bag :: WildList a -> Bag
```

This is strange - how could `WildList` ever be used without knowing the type of `a`?

### A witness is found

Let's look at its definition. (`Witness` defined later.)

```Haskell
data WildList a = WildList {
  sample  :: Witness a
  , daata :: [a]
}
```

This should remind you of the TypeScript version. (despite that I can's use `data` directly so we must make do with `daata` which is my attempt at enunciating the Kiwis (New Zealanders) accent.)

Of course `Witness a` is the star of the moment, and the answer to how we can use `Bag` without specifying the type of `a`. The `sample` field will bear witness to the type of elements to `daata`. 

### An instance is missing

Now we can see what `Witness` looks like.

```Haskell
data Witness a where
  WitnessInt :: Witness Int
  WitnessStr :: Witness String

witInt :: Witness Int
witInt = WitnessInt

witBool :: Witness Bool
witBool = _  -- no instance?!
```

By the way this `where` syntax is called `GADTs` (Generalised Algebraic Datatypes). It's an advanced feature and should not be how most Haskell types are written.

This again is strange - the constructors `WitnessInt` and `WitnessStr` do not take any type parameters, but they carry information about specific types. `WitnessInt` carries `Int`, and `WitnessStr` carries `String`.

Also notice `Witness a` is not *really* parametrically polymorphic - well, we can declare a value to be of type `Witness Bool`, but it's not possible to construct it... strange again.

If you can bear with the strangeness, then get ready for how `Bag` can be constructed.

```Haskell
bagOfInts = Bag $ WildList WitnessInt [1,2,3]
bagOfStrs = Bag $ WildList WitnessStr ["a", "b", "c"]
```

### Haskell is dynamic?

With type witnesses, we can write some Haskell code that looks almost dynamic. 

Supposed we have two functions: `sumStrs` concatenates strings, and `sumInts` sums integers and convert the result to a string.

```Haskell
sumStrs :: [String] -> String
sumStrs = unwords

sumInts :: [Int]  -> String
sumInts = show . sum
```

Now let's say we have a `Bag`, which does not reveal what type of data it contains. How do we unwrap its data and then apply either `sumStrs` or `sumInts`? Of course, the answer is with the witnesses.

```Haskell
unwrap :: Bag -> String
unwrap (Bag bag) =
  case sample bag of
  WitnessInt -> sumInts $ daata bag
  WitnessStr -> sumStrs $ daata bag
```

This way, we can have a heterogeneous list of `[Bag]` and process it as if it's dynamic. Watch out.

```Haskell
main = do
  mapM_ (putStrLn . unwrap) [ bagOfInts, bagOfStrs ]
```

Wow!

([Full code on GitHub](https://github.com/hackle/blog-rust/blob/master/sample/type-witness-wildlist-bag.hs))