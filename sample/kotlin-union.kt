sealed interface Maybe<T> 
data class Just<T>(val value: T) : Maybe<T>
data object None : Maybe<Nothing>

typealias ErrorCode = Int
typealias Payment = Any
typealias Cash = Int

interface HasErrorMessage {
    val errorMessage: String
}

class PayResultUnunified {
    sealed interface PayResult<out T : Payment> {
        data class Success<P : Payment>(val value: P) : PayResult<P>

        data class NotEnoughBalance(
            val minimum: Long
        ) : PayResult<Nothing> {
            val errorMessage = "Not enough balance."
        }

        data class Unauthenticated(
            val serverErrorCode: ErrorCode
        ) : PayResult<Nothing> {
            val errorMessage = "Authentication failed."
        }
    }

    fun extractError(payResult: PayResult<Cash>): String? =
        when (payResult) {
            is PayResult.Success -> null
            is PayResult.NotEnoughBalance -> payResult.errorMessage
            is PayResult.Unauthenticated  -> payResult.errorMessage
        }

    fun extractErrorSafe(payResult: PayResult<Nothing>): String =
        when (payResult) {
            is PayResult.NotEnoughBalance -> payResult.errorMessage
            is PayResult.Unauthenticated  -> payResult.errorMessage
            is PayResult.Success -> "Impossible"
        }

    fun runDisplay() {
        val result = PayResult.Unauthenticated(1)
        val error = extractError(result)
        println(result)

        val resultSuccess = PayResult.Success(100)
        // not allowed
        // val errorSafe = extractErrorSafe(resultSuccess)
        // println(error)
    }
}

class PayResultExtended {
    sealed interface PayResult<out T : Payment> {
        data class Success<P : Payment>(val value: P) : PayResult<P>

        data class NotEnoughBalance(
            val minimum: Long
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Not enough balance."
        }

        data class Unauthenticated(
            val serverErrorCode: ErrorCode
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Authentication failed."
        }
    }

    sealed interface CreditCardPayResult<out T : Payment> : PayResult<T> {
        data class SuspectedScam(
            val probability: Float
        ) : CreditCardPayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Watch out! Likely a scam!"
        }
    }

    // error: 'when' expression must be exhaustive. 
    // Add the 'is SuspectedScam' branch or an 'else' branch.
    // fun makeDisplayMessage(payResult: PayResult<Cash>) =
    //     when(payResult) {
    //         is PayResult.Success -> "All paid!"
    //         is PayResult.NotEnoughBalance,
    //         is PayResult.Unauthenticated,
    //             -> payResult.errorMessage
    //     }

    // fun runDisplay() {
    //     val result = PayResult.Unauthenticated(1)

    //     val resultSuccess = PayResult.Success(100)
    //     // not allowed
    //     // val errorSafe = extractErrorSafe(resultSuccess)
    //     // println(error)
    // }
}

class PayResultReverseExtended {
    sealed interface PayResult<out T : Payment> : CreditCardPayResult<T> {
        data class Success<P : Payment>(val value: P) : PayResult<P>

        data class NotEnoughBalance(
            val minimum: Long
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Not enough balance."
        }

        data class Unauthenticated(
            val serverErrorCode: ErrorCode
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Authentication failed."
        }
    }

    sealed interface CreditCardPayResult<out T> {
        data class SuspectedScam(
            val probability: Float
        ) : CreditCardPayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Watch out! Likely a scam!"
        }
    }

    fun makeDisplayMessage(payResult: PayResult<Cash>) =
        when(payResult) {
            is PayResult.Success -> "All paid!"
            is PayResult.NotEnoughBalance,
            is PayResult.Unauthenticated,
                -> payResult.errorMessage
        }

    fun makeDisplayMessage(payResult: CreditCardPayResult<Cash>) =
        when(payResult) {
            is PayResult.Success -> "All paid!"
            is PayResult.NotEnoughBalance,
            is PayResult.Unauthenticated,
            is CreditCardPayResult.SuspectedScam,
                -> payResult.errorMessage
        }

    fun runDisplay() {
        // val resultSuccess = PayResult.Success(100)
        // not allowed
        // val errorSafe = extractErrorSafe(resultSuccess)
        // println(error)
    }
}

class PayResultUnified {
    sealed interface PayResult<out T : Payment> {
        data class Success<P : Payment>(val value: P) : PayResult<P>

        data class NotEnoughBalance(
            val minimum: Double
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Not enough balance."
        }

        data class Unauthenticated(
            val serverErrorCode: ErrorCode
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Authentication failed."
        }
    }

    fun extractErrorSafe(withErrorMessage: HasErrorMessage): String =
        withErrorMessage.errorMessage

    fun makeDisplayMessage(payResult: PayResult<Cash>) =
        when(payResult) {
            is PayResult.Success -> "All paid!"
            is PayResult.NotEnoughBalance,
            is PayResult.Unauthenticated,
                -> payResult.errorMessage
        }

    fun runDisplay() {
        val result = PayResult.Unauthenticated(1)
        val errorMessage = extractErrorSafe(result)
        println(errorMessage)

        println(makeDisplayMessage(result))
    }
}

class PayResultSealedAgain {
    sealed interface HasErrorMessage {
        val errorMessage: String
    }

    // even a 3rd is allowed outside of PayResult
    data object Foo : HasErrorMessage {
        override val errorMessage = "foo"
    }

    sealed interface PayResult<out T : Payment> {
        data class Success<P : Payment>(val value: P) : PayResult<P>

        data class NotEnoughBalance(
            val minimum: Double
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Not enough balance."
        }

        data class Unauthenticated(
            val serverErrorCode: ErrorCode
        ) : PayResult<Nothing>, HasErrorMessage {
            override val errorMessage = "Authentication failed."
        }
    }

    fun makeDisplayMessage(payResult: PayResult<Cash>) =
        when(payResult) {
            is PayResult.Success -> "All paid!"
            is HasErrorMessage -> payResult.errorMessage
        }

    fun runDisplay() {
        val result = PayResult.Unauthenticated(1)
        println(makeDisplayMessage(result))
    }
}

fun showIncrement(mustBeJust: Just<Int>) {
    println(mustBeJust.value + 1)
}

sealed interface SBoolean
data object STrue : SBoolean
data object SFalse : SBoolean

fun runRiskyOperation(mustHaveAcknowledged: STrue) {
    println("By this point, you have acknowledged.")
}

object Exhaustive {
    fun runAtRisk(acknowledgedOrNot: SBoolean) {
        when (acknowledgedOrNot) {
            STrue -> runRiskyOperation(STrue)
            SFalse -> println("Cannot run operation without acknowledgement.")
        }
    }
}

object NonExhaustive {
    fun runAtRisk(acknowledgedOrNot: SBoolean) {
        when (acknowledgedOrNot) {
            STrue -> runRiskyOperation(STrue)
            else -> println("Cannot run operation without acknowledgement.")
        }
    }
}


sealed interface SEBoolean { val value: Boolean }
enum class SETrue(override val value: Boolean) : SEBoolean { TRUE(true) }
enum class SEFalse(override val value: Boolean) : SEBoolean { FALSE(false) }

sealed interface Nat
data object Zero : Nat
data class Succ<T : Nat>(val pred: T) : Nat

fun <T : Nat> decrement(n: Succ<T>): T = n.pred

// fun <T1 : Nat, T2: Nat> add(n1: T1, n2: T2): Add<T1, T2> <- not possible

fun runDecre() {
    val n0 = decrement(Succ(Zero))
    val n1 = decrement(Succ(Succ(Zero)))

    println("$n0 $n1")
}

// fun increment<T : Nat<*>>(n: Nat<T>) : Succ<Nat<T>> = Succ(n)

fun main() {
    val just2: Just<Int> = Just(2)
    showIncrement(just2)

    val naught: None = None
    println("It is $naught")

    Exhaustive.runAtRisk(SFalse)

    runDecre()

    PayResultUnunified().runDisplay()
    PayResultUnified().runDisplay()
    PayResultSealedAgain().runDisplay()
}