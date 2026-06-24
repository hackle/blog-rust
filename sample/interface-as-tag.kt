interface A
interface B
interface C

fun <V> buildMap(
    vararg kv: Pair<String, V>,
) : Map<String, V> where V : A, V : B =
    kv.toMap()

data object AB : A, B
data object ABC : A, B, C

fun main() = println(buildMap("k" to AB, "g" to ABC))