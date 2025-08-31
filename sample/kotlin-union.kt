sealed interface Maybe<T> 
data class Just<T>(val value: T) : Maybe<T>
data object Nothing : Maybe<Nothing>


sealed interface PayResult<out T> {
    interface HasError {
        val error: String
    }

    data class Success<T>(val value: T) : PayResult<T>

    data class NotEnoughBalance(val reason: String) : PayResult<Nothing>, HasError {
        override val error = "Not enough balance."
    }

    data class Unauthenticated(val reason: String) : PayResult<Nothing>, HasError {
        override val error = "Authentication failed."
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

fun runAtRisk(acknowledgedOrNot: SBoolean) {
    when (acknowledgedOrNot) {
        STrue -> runRiskyOperation(STrue)
        SFalse -> println("Cannot run operation without acknowledgement.")
    }
}

fun main() {
    val just2: Just<Int> = Just(2)
    showIncrement(just2)

    val naught: Nothing = Nothing
    println("It is $naught")

    runAtRisk(SFalse)

    val payResult: PayResult<*> = PayResult.Unauthenticated("oops")

    val forDisplay = when (payResult) {
        is PayResult.Success -> "Deal done!"
        is PayResult.NotEnoughBalance,
        is PayResult.Unauthenticated,
        // is PayResult.HasError
            -> payResult.error
    }

    println(forDisplay)
}