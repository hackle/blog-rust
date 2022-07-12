Take a guess: which of the two diagrams represent expression-based code and which statement-based?

Let me use the simplest elements to represent a  program: circles for values and arrows for code (or more computing). Then this function 

```
fun goodMorning(weather, time) {
    val isAm = time.AmPm == 'Am'
    val isSunny = weather.code == 'Sunny'

    return (isAm and isSunny)
}
``` 

Is represented as this.

It may appear not all computation start or finish with a value as far as the expressions or statements are concerned.

On the other hand, the same function but implemented differently,

```
fun goodMorning(weather, time) {
    var isGoodMorning
    if time.AmPm != 'Am'
        isGoodMorning = false

    if weather.code != 'Sunny'
        isGoodMorning = false

    isGoodMorning = true

    return isGoodMorning
}
``` 
