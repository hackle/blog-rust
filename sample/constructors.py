from dataclasses import dataclass
from decimal import Decimal
from typing import Callable, Literal, Never, Self
from pydantic import BaseModel, constr


@dataclass
class Person:
    name: str
    
    @classmethod
    def with_name(cls, name: str) -> Self | None:
        return cls(name) if name else None


def person_ctr(ctor: Callable[[str], Person]) -> Person:
    return ctor("Hackle")

person = person_ctr(Person)
# Person(name='Hackle')

# print(Person.with_name(""))
# print(Person.with_name("Hackle"))
# None
# Person(name='Hackle')

@dataclass
class CreditCard:
    number: str
    pin: str

@dataclass
class Cash:
    amount: Decimal
    change: Decimal

PaymentMethod = CreditCard | Cash

def format_payment(pm: PaymentMethod) -> str:
    match pm:
        case CreditCard(): return f"Card No. {pm.number} pin {pm.pin}"
        case Cash(): return f"Cash {pm.amount} change {pm.change}"
        case _: _impossible: Never = pm; return "Impossible"

# print(format_payment(CreditCard(number="0000...", pin="000")))
# print(format_payment(Cash(amount=Decimal(20), change=Decimal(3.5))))


class ConstrainedCreditCard(BaseModel):
    number: constr(min_length=13, max_length=16)
    pin: str


print(ConstrainedCreditCard(number="0000000000000000000", pin="000"))