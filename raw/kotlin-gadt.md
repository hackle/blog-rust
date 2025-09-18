Kotlin is reputed for being handy at making DSLs (Domain Specific Language), for much hyped syntactic bells-and-whistles such as infix functions, operator overloading, trailing lambdas with or without receivers.

But syntax is not all there is to DSLs - the hard-learned lesson shared by users and makers alike - syntax is secondary to correctness. Take the example of trailing lambda with receiver, when used in tandem with mutation for the likes of builders, as is too often the case, forms a disgusting pattern that undermines correctness, and should be avoided at all cost, no matter how "nice" the syntax looks.

Which takes us to the less hyped but truly excellent feature: union types with elegant GADT compatibility that unlock type-safe DSLs. This is made possible by Kotlin's dialect of union type in the form of sealed interface/class (see [previous post](/curious-kotlin-union)), incorporating the advantages of sub-typing that gives surprising flexibility and pleasing ergonomics.

Typically taught in Haskell, GADT is a _strange_ form of "generics" that is best shown in code. Let's start with the obligatory example of a minimal DSL for arithmetic, as below,

```Haskell
-- for brevity, Subtract | Multiply | Divide are left out
data Term = Lit Int | Add Term Term

eval :: Term -> Int
eval (Lit n) = n
eval (Add t1 t2) = eval t1 + eval t2

t1 = eval (Add (Lit 2) (Add (Lit 3) (Lit 4)))
-- 9
```

Very nice. Next we want to introduce an `Eql` constructor (for equality, but namely differently than the `Eq` type class) into the `Term` type. But adding a simple `Eql Term Term` doesn't make sense, because it allows bad terms such as `Eql (Eql (Lit 1) (Lit 2)) (Lit 3)`, or `Add (Eql (Lit 1) (Lit 2)) (Lit 3)`. We must use GADT, which allows us to make `Term` generic (more properly, parametrically polymorphic) with restricted / opinionated type variables, like below,

```Haskell
-- the syntax is also a bit strange
data Term a where
    Lit  :: Int -> Term Int
    Add  :: Term Int -> Term Int -> Term Int
    Eql   :: Term Int -> Term Int -> Term Bool

eval :: Term a -> a
eval (Lit n) = n
eval (Add t1 t2) = eval t1 + eval t2
eval (Eql t1 t2) = eval t1 == eval t2
```

Now try as you may, the bad terms cannot even be constructed! Talk about designing illegal states out of existences.

However, the sharp reader would have picked up the strangeness - from the type alone, `Term a` seems to allow any type variable in the place of `a`, as would be the case for "normal" generics, but that's but an illusion: the constructors clearly show that only `Int` and `Bool` are ever allowed. In other words, a type like `Term String` has no values (or, is uninhabited)!

This "strange" feature gives us the expressive power to model the DSL with accuracy and soundness, and is therefore highly valuable. It is then no surprise that programmers seek to emulate GADT in other languages. For our case, indeed, the `Term` type can be ported to Kotlin as below,

```Kotlin
sealed interface Term<T>

data class Lit(val value: Int) : Term<Int>
data class Add(val t1: Term<Int>, val t2: Term<Int>) : Term<Int>
data class Eq(val t1: Term<Int>, val t2: Term<Int>): Term<Boolean>
```

See? It's the same idea with slight change in syntax. We get the benefits of designing bad terms out of existence; the resemblance holds even for the emptiness of type `Term<String>`. Uncanny!

However, we hit a snag when trying to evaluate a `Term`, because while Kotlin allows defining "opinionated" generics, it's not so powerful when it comes to unifying `Int` and `Boolean` into generics, as follows,

```Kotlin
fun <T> eval(term: Term<T>) : T = 
    when (term) {
        is Lit -> term.value as Int
        is Add -> eval(term.t1) as Int + eval(term.t2) as Int
        is Eq -> eval(term.t1) as Int == eval(term.t2) as Int
    } as T
```

We may bet a house on the correctness of `eval`: `term.value` must be `Int` for the `Lit` branch, but Kotlin would not unifying the return types `Int` and `Boolean` into `T`, it must be forced to do so with `as T`, an ugliness that unfailingly turns many a serious programmer's stomach. There is even a proposal to address this issue by adding a feature called ["subtyping reconstruction"](https://github.com/Kotlin/KEEP/issues/409).

This may be where we rue the inferiority of Kotlin to Haskell, but it needs not necessarily be the case. You see, I am not alone in thinking GADT a hack, or less offensively, at least a mind-bender in allowing unifying concrete types into a generic type. It would actually be nice if Kotlin does not need to follow the example of Haskell blindly. Luckily, we have sub-typing at our disposal; it's as simple as adding a function to the interface, as follows,

```Kotlin
sealed interface Term<T> {
    fun eval(): T
}

data class Lit(val value: Int) : Term<Int> {
    override fun eval() = value
}

data class Add(val t1: Term<Int>, val t2: Term<Int>) : Term<Int> {
    override fun eval() = t1.eval() + t2.eval()
}

data class Eq(val t1: Term<Int>, val t2: Term<Int>): Term<Boolean> {
    override fun eval() = t1.eval() == t2.eval()
}
```

What happened here? We went _classist_! Because `eval()` is implemented by each member type to return the instantiated `T`, respectively `Int` and `Boolean`, there is no need for any casting, Type safe is preserved, crisis averted. 

In a way, we can keep the good side of GADT, and avoid its ugliness. As far as Kotlin is concerned, one can say this solution is arguably more elegant, and definitely more idiomatic than blindly following the foot steps of Haskell.
