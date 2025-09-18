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

sealed interface IntTerm : Term<Int>
sealed interface BooleanTerm : Term<Boolean>

// fun IntTerm.evalExt(): Int = when (this) { 
//     is Lit -> value
//     is Add -> t1.evalExt() + t2.evalExt()
// }

// fun BooleanTerm.evalExt() = when(this) {
//     is Eq -> t1.evalExt() == t2.evalExt()
// }

// fun <T> eval(term: Term<T>) : T = 
//     when (term) {
//         is Lit -> term.value as Int
//         is Add -> eval(term.t1) as Int + eval(term.t2) as Int
//         is Eq -> eval(term.t1) as Int == eval(term.t2) as Int
//     } as T

fun main() {
    val term = Eq(Add(Lit(1), Lit(2)), Lit(3))
    // val result = eval(term)
    // val resultExt = term.evalExt()

    // println(result)
    // println(resultExt)

    println(term.eval())
}