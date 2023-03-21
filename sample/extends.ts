export {};

interface Named { name: string }
function greet<T extends Named>(named: T): string {
    return `Hello ${named.name}!`;
}

greet({ name: 'Hackle', city: 'Auckland' });
greet({ name: 'Computer', cost: 1300, currency: 'NZD' });
// greet({ firstname: 'Hackle' }); // Argument of type '{ firstname: string; }' is not assignable to parameter of type 'Named'.


function amHappy<T extends 'Saturday' | 'Sunday'>(day: T): true {
    return true;
}

amHappy('Saturday');
amHappy('Sunday');

declare const friday: 'Saturday' | 'Sunday' | 'Friday';
// amHappy(friday);  // Argument of type '"Saturday" | "Sunday" | "Friday"' is not assignable to parameter of type '"Saturday" | "Sunday"'.


type IsNumber<T> = T extends number ? "It's a number" : "It's not a number";

const v1: IsNumber<number> = "It's a number";
const v2: IsNumber<string> = "It's not a number";
// const v3: IsNumber<string> = "It's a number";   // Type '"It's a number"' is not assignable to type '"It's not a number"'.ts(2322)

type Weekend =  'Saturday' | 'Sunday';

type IsWeekend<T> = T extends Weekend ? true : false;

type Funday = 'Friday' | 'Saturday' | 'Sunday';

const v3: IsWeekend<Funday> = true;
const v4: IsWeekend<Funday> = false;


type IsWeekendExactly<T> = [T] extends [Weekend] ? true : false;

const v5: IsWeekendExactly<Funday> = false;
const v6: IsWeekendExactly<Funday> = true;  // Type 'true' is not assignable to type 'false'.ts(2322)


type IsWeekendExactlyInvariant<T> = ((o: T) => T) extends ((o: Weekend) => Weekend) ? true : false;

const v7: IsWeekendExactlyInvariant<Funday> = false;    // super-type, NOT OK
const v9: IsWeekendExactlyInvariant<'Sunday'> = true;  // error: sub-type, NOT OK
const v8: IsWeekendExactlyInvariant<'Saturday' | 'Sunday'> = true;    // exactly the same type, OK


type IsWeekendExactlyCovariant<T> = (() => T) extends (() => Weekend) ? true : false;

const v20: IsWeekendExactlyCovariant<Funday> = false;
const v22: IsWeekendExactlyCovariant<Funday> = true;  // error: super-type, NOT OK
const v21: IsWeekendExactlyCovariant<'Saturday'> = true;    // sub-type, OK


type IsWeekendExactlyContravariant<T> = ((o: T) => void) extends ((o: Weekend) => void) ? true : false;

const v31: IsWeekendExactlyContravariant<Funday> = false;   // error: sub-type, NOT OK
const v32: IsWeekendExactlyContravariant<Funday> = true;  // super-type OK


type FuncParams<T> =
    T extends ((...params: infer P) => unknown) ? P : never;

declare function fives(n: number, d: string): void;

// p1: [number, string]
const p1: FuncParams<typeof fives> = [1, "s"];


type CSV<T extends string[]> =
    T extends [] 
        ? never
        : T extends [infer U extends string]
            ? `${U}`
            : T extends [infer U extends string, ...infer R extends string[]]
                ? `${U},${CSV<R>}`
                : never;

const csv1: CSV<['apple', 'banana', 'pear']> = 'apple,banana,pear';
                
