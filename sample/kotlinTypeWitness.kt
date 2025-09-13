// Base type: a Term that evaluates to A
sealed class Term<A>

// Literal Int proves A = Int
data class LitInt(val value: Int) : Term<Int>()

// Literal Bool proves A = Boolean
data class LitBool(val value: Boolean) : Term<Boolean>()

// Pair proves A = Pair of (a, b)
// data class PairTerm<A, B>(
//     val left: Term<A>,
//     val right: Term<B>
// ) : Term<Pair<A, B>>()

fun <A> eval(term: Term<A>): A = when (term) {
    is LitInt -> term.value as A
    is LitBool -> term.value as A
    // is PairTerm<*, *> -> {
    //     val left  = eval(term.left)
    //     val right = eval(term.right)
    //     @Suppress("UNCHECKED_CAST")
    //     Pair(left, right) as A
    // }
}

fun main() = println("hello")