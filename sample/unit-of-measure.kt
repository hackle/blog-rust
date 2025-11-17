interface UoM {
    val value: String
}

enum class KM : UoM {
    V
    ;
    
    override val value = "KM"

    override fun toString() = value
}

data class VoM<T : Number, M : UoM>(val value: T, val voMString: String) {
    override fun toString() = "$value<$voMString>"
}

operator inline fun <reified M> Double.invoke() where M : UoM, M : Enum<M> = 
    VoM<Double, M>(this, enumValues<M>().first().toString())

fun main() {
    val n1 = 1.5<KM>()
    println("hello $n1")
}