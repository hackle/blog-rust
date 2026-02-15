enum class Key { A, B }

data class ExhaustiveEnumMap<T : Enum<T>, V>(
    private val keys: Set<T>,
    private val map: (T) -> V,
) {
    val values = keys.associateWith { map(it) }

    operator fun get(k: T) = values.getValue(k)
}

fun main(): Unit {
    val xmap = ExhaustiveEnumMap(Key.entries.toSet()) { e ->
        when (e) {
            Key.A -> "a"
            Key.B -> "b"
        }
    }

    println("hello" + xmap)
}

