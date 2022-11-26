Let's tackle a seemingly easy topic in regards to strong typing. We all know "stringly-typed" code is bad, and may think the discussions have been had, and the problem has been solved. However, beyond the simple and obvious, there lay less well-known ambushes and treachery, and it's my pleasure to reveal one or two.

## Beyond the obvious

We'll start with the usual: using `string` when a more fitting type should be used.

```python
class Payment:
    amount: string  # a number type is more fitting
```

Obviously `amount` as `string` cannot be used for addition or subtraction, as would be expected - very bad typing! Understanding this, we clinically apply the fix,

```python
class Payment:
    amount: decimal
```

Glorious. But let's not linger ont he obvious. What about payment type?

```python
class Payment:
    type: str

credit = Payment(type="CreditCard")
```

This is less obvious than using `string` for `amount`. In fact, it looks pretty legit! However, using `str` for `Payment.type` should spell trouble as long as type-safety is concerned, as it's free-form and wide open for bad input and incorrect interpretation.

## Constants is not the solution!

The traditional wisdom would pounce at this and shell out an immediate solution: constants! 

```python
PAYMENT_TYPE_CREDIT = "CreditCard"
PAYMENT_TYPE_CASH = "Cash"

class Payment:
    type: str

credit = Payment(type=PAYMENT_TYPE_CREDIT)
```

While the call-site does give the appearance of discipline, it is an illusion at best. The underlying type is still a free-form `str` and is still open to bad input. Any new user of `Payment` is none the wiser! 

Such usage of constants for typing is what I'd like to call "type-safety theatre": going through the motion of creating the appearance without addressing the real issues.

## Enum is not enough

Users of less primitive typed language have a better tool at their disposal: enum.

```python
class PaymentType(Enum):
    Credit = "CreditCard"
    Cash = "Cash"

class Payment:
    type: PaymentType

credit = Payment(type=PaymentType.Credit)
```

This is a pretty good solution as far as `Payment.type` is concerned. But let's now look at other fields for `Payment`.

```python
class Payment:
    type: PaymentType
    credit_card_number: Optional[str]

# fine
credit = Payment(type=PaymentType.Credit, credit_card_number="XXX1234")

# not cool
cash = Payment(type=PaymentType.Cash, credit_card_number="XXX1234")
```

The field `credit_card_number` should not be applicable to `PaymentType.Cash`. But the above `Payment` type has no way of enforcing such a constraint. It seems we reached the limit of what traditional `Enum` has to offer, what now?

Ho ho ho, stronger typing is very much possible, in the form of union types.

```python
class CreditCardPayment:
    credit_card_number: str # not optional!

class CashPayment:
    counter: str

Payment = CreditCardPayment | CashPayment
```

While it's generally accepted to stop at the `Enum` solution and feel pretty good about ourselves, we dug a bit deeper to reach the realisation that being `stringly-typed`, or using `Enum` naively can indicate inadequate modelling.

(Despite having the same name, `enum` in Swift or Rust is different - it's closer to union types.)

### Tagging: the false positive

A convenient tangent - [unions can be untagged](/untaged-union-undecidable), as in TypeScript. We may be required to tag types manually,

```TypeScript
type CreditCardPayment = { _tag: 'CreditCard', credit_card_number: string };
type CashPayment = { _tag: 'Cash', counter: string };

type Payment = CreditCardPayment | CashPayment;
```

By force of habit, beginners to TypeScript will be tempted to create constants for the strings, but this is counter-productive! These `_tag` strings are actually *literal types* and can be used to differentiate sub-types of `Payment`. Such usage is also referred to as "type narrowing". 

So stay off these "`string`s"!

## String Encoding 

Consider this function `pay_water_bill` that rejects American Express cards.

```Python
def pay_water_bill(credit: CreditCard):
    if credit.card_number.startswith("34") or credit.card_number.startswith("37"):
        raise Error("We do not accept American Express")
    else:
        # makes payment
```

If I call this bad code, many readers would disagree - isn't this how we recognise credit card types in real life?! (a rant on the "real-life" argument is spared for brevity)

May be so, but this code still **encodes type information in a `string`**! While the common pitfalls such as casing or white-spaces do not apply here, chances are the string-based branching logic will be repeated elsewhere, e.g. for input validation.

This is a less obvious example of "under-typing": using a primitive type to encode extra information. Stronger typing usually means encoding such information explicitly with types. How can we do that? 

A good idea - as soon as input for `CreditCardPayment` enters the boundary of the application (user input, reading data from the database or web services), convert it to more informative types by means of parsing (a better alternative to validation).

```Python
CreditCard = AmericanExpress | Visa | Mastercard | Discover

def parse_credit_card(raw_data) -> CreditCard:
    if raw_data.card_number.startswith("34") or raw_data.card_number.startswith("37"):
        # check card_number is valid
        return AmericanExpress(raw_data.card_number, ...)
    else if ...

# now reject AmericanExpress with types!
# type guards are helpful to remove AmericanExpress from the union type
def pay_water_bill(credit: Visa | Mastercard | Discover):
    # makes payment
```

The boundary of the application is the place weak typing is kept out, and strong typing is put in. In this case, rich information encoded in a simple `string` is intercepted, interpreted and represented more visibly in stronger types, so the application does not have to fall back to interpreting a `string` to reverse-engineer key information - a loud sign of weak typing!

## Summary

Stronger typing is all about finding and using accurate ways to represent and communicate information. Often we need to look beyond the simple and obvious, for example, `stringly-typed` code can be a sign of deeper design issues that require more sophisticated modelling.
