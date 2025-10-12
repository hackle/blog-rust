

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Protocol, Self


@dataclass
class Bounded:
    value: int
        
    @staticmethod
    @abstractmethod
    def lower() -> int:
        pass
    
    @staticmethod
    @abstractmethod
    def upper() -> int:
        pass

    @classmethod
    def makeUnsafe(cls, value: int) -> Self | None:
        return cls(value) if (value >= cls.lower() and value <= cls.upper()) else None


class Between1And5(Bounded):
    def upper() -> int:
        return 5
    
    def lower() -> int:
        return 1

v1 = Between1And5.makeUnsafe(3)
v2 = Between1And5.makeUnsafe(6)
print(v1)
print(v2)