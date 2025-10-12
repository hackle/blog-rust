sealed interface SingletonInt {
    val value: Int

    enum class _2(override val value: Int = 2) : SingletonInt {
        TWO
    }
    enum class _5(override val value: Int = 5) : SingletonInt { 
        FIVE
    }
}

inline fun <reified E> reflect(): Int 
    where E : SingletonInt, E : Enum<E> =
        enumValues<E>().first().value

data class FixedSizeList<TSize, T> private constructor(
    val value: List<T>
) {
    companion object {
        fun <TSize, T> makeUnsafe(unsafeValue: List<T>) =
            FixedSizeList<TSize, T>(unsafeValue)

        inline fun <reified TSize, T> tryMake(uncheckedValue: List<T>)
            where TSize : SingletonInt, TSize : Enum<TSize> =
            if (reflect<TSize>() == uncheckedValue.size)
                makeUnsafe<TSize, T>(uncheckedValue)
                else null
    }
}

// fun make2to5(value: Int) = makeInRange<SingletonInt._2, SingletonInt._5>(value)

interface Bounded<L, U, Self>
    where L : SingletonInt, L : Enum<L>, U : SingletonInt, U : Enum<U> {
        val lower: L
        val upper: U
    }

inline fun <reified L, reified U, Self : Bounded<L, U, Self>> createBounded(
    crossinline ctor: (Int) -> Self
) where L : SingletonInt, L : Enum<L>, U : SingletonInt, U : Enum<U>
    = fun(value: Int): Self? {
        val range = reflect<L>() .. reflect<U>()
        return if (value in range) ctor(value) else null
    }

@ConsistentCopyVisibility
data class Bounded2To5 private constructor(
    val value: Int,
    override val lower: SingletonInt._2 = SingletonInt._2.TWO,
    override val upper: SingletonInt._5 = SingletonInt._5.FIVE,
) : Bounded<SingletonInt._2, SingletonInt._5, Bounded2To5> {
    companion object {
        val create = createBounded(::Bounded2To5)
    }
}

@ConsistentCopyVisibility
data class Weekday private constructor(val value: Int) {
    companion object {
        fun create(value: Int) =
            if (value in 1..7) Weekday(value) else null
    }
}

fun main() {
    // println(Weekday.create(1))
    // println(Weekday.create(8))

    // println(Bounded2To5.create(2))
    // println(Bounded2To5.create(6))

    val listOf2 = FixedSizeList.tryMake<SingletonInt._2, Int>(listOf(3, 4))
    // FixedSizeList(value=[3, 4])

    val listOf2Bad = FixedSizeList.tryMake<SingletonInt._2, Int>(listOf(5))
    // null

    println(listOf2)
    println(listOf2Bad)

    val listOf5: FixedSizeList<SingletonInt._5, Int> = listOf2!!
    // error: initializer type mismatch: expected 'FixedSizeList<SingletonInt._5, Int>', 
    // actual 'FixedSizeList<SingletonInt._2, Int>'

    println(listOf5)
}