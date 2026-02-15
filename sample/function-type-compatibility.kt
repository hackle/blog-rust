fun withDefault(code: String = "foo") = println(code)

val noop: () -> Unit = ::withDefault

fun main() = noop(Unit)