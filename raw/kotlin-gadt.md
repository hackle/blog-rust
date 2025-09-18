Kotlin is reputed for being a handy tool at making DSLs (Domain Specific Language), for much hyped syntactic bells-and-whistles such as infix functions, operator overloading, trailing lambdas with or without receivers.

Enter the hard-learned lesson for any DSL maker - syntax is secondary to correctness. Take the example of trailing lambda with receivers, when used in tandem with mutation for the likes of builders, as is too often the case, it forms a disgusting pattern that undermines correctness, and should be avoided at all cost, no matter how "nice" the syntax looks.

Which takes us to the less hyped but truly excellent feature: union types with elegant GADT compatibility that unlock type-safe DSLs. This is made possible by Kotlin's dialect of union type in the form of sealed interface/class (see [previous post](/curious-kotlin-union)), combining the advantages of sub-typing and more conventional union types, to give surprising flexibility and pleasing ergonomics.

Typically taught in Haskell, GADT is a _strange_ form of "generics", that is best shown in code. Let's start with the obligatory example of a minimal DSL for arithmetic, as below,

```Haskell
-- for brevity, Subtract | Multiply | Divide are left out
data Term = Lit Int | Add Term Term

eval :: Term -> Int
eval (Lit n) = n
eval (Add t1 t2) = eval t1 + eval t2

t1 = eval (Add (Lit 2) (Add (Lit 3) (Lit 4)))
-- 9
```

Very nice. But now if we want to introduce `Eql` for equality (to differentiate against the `Eq` class) into the `Term` type, the simple `Eql Term Term` doesn't make sense, because it allows bad terms such as `Eql (Eql (Lit 1) (Lit 2)) (Lit 3)`, or `Add (Eql (Lit 1) (Lit 2)) (Lit 3)`. GADT allow us to make `Term` generic (more properly, parametrically polymorphic) with restricted / opinionated type variables, like below,

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

Now the bad terms cannot even be constructed! Talk about designing illegal states out of existences.

However, the sharp reader would have picked some the strangeness - `Term a` seems to allow any type variable in the place of `a`, as would be the case for "normal" generics, but that's but an illusion: only `Int` and `Bool` are ever allowed. In other words, a type like `Term String` has no values (or, uninhabited)!

This "strange" feature gives us the expressive power to model the DSL with accuracy and soundness, and is therefore highly valuable. It is then no surprise that programmers seek to emulate GADT in other languages. For our case, indeed, the `Term` type can be ported to Kotlin as below,

```Kotlin
sealed interface Term<T>

data class Lit(val value: Int) : Term<Int>
data class Add(val t1: Term<Int>, val t2: Term<Int>) : Term<Int>
data class Eq(val t1: Term<Int>, val t2: Term<Int>): Term<Boolean>
```

See? It's the exact same idea with slight change in syntax. We get the same benefits of designing bad terms out of existence. The resemblance holds even for the emptiness of type `Term<String>`. Uncanny!

However, we hit a snag when trying to evaluate a `Term`, because while Kotlin allows defining "opinionated" generics, it's not so powerful when it comes to unifying values of `Term<T>`, as follows,

```Kotlin
fun <T> eval(term: Term<T>) : T = 
    when (term) {
        is Lit -> term.value as Int
        is Add -> eval(term.t1) as Int + eval(term.t2) as Int
        is Eq -> eval(term.t1) as Int == eval(term.t2) as Int
    } as T
```

We may bet a house on the correctness of `eval`: `term.value` must be `Int` for the `Lit` branch, but Kotlin would not unifying the return types `Int` and `Boolean` into `T`, it must be forced to do so with `as T`, an ugliness that unfailingly turns many serious programmers' stomach. There is even a proposal to address this issue by adding a feature called ["subtyping reconstruction"](https://github.com/Kotlin/KEEP/issues/409).

This may be where we rue the inferiority of Kotlin to Haskell, but it needs not necessarily be the case. You see, I cannot be alone in thinking GADT a hack, or less offensively, at least a mind-bender; Kotlin needs not follow the example of Haskell blindly. Why? Sub-typing is all we need to solve this problem. See below,

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

What happened here? We went _classist_! Because `eval()` is implemented by each member type to return the instantiated `T`, respectively `Int` and `Boolean`, there is no need for any casting, it's completely type safe. Crisis averted. In a way, we keep the good side of GADT, and avoided its ugly side. One can reasonably argue this solution is more elegant, at least more idiomatic than closely following the foot steps of Haskell.
