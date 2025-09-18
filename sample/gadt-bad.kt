sealed interface Term<T>

data class Lit(val value: Int) : Term<Int>
data class Add(val t1: Term<Int>, val t2: Term<Int>) : Term<Int>
data class Eq(val t1: Term<Int>, val t2: Term<Int>): Term<Boolean>

fun <T> eval(term: Term<T>) : T = 
    when (term) {
        is Lit -> term.value as Int
        is Add -> eval(term.t1) as Int + eval(term.t2) as Int
        is Eq -> eval(term.t1) as Int == eval(term.t2) as Int
    } as T

fun main() {
    val result = eval(Eq(Add(Lit(1), Lit(2)), Lit(3)))

    println(result)
}