type CreditCardNo = `${number}-${number}-${number}-${number}`;

type LengthIs<N extends number, xs extends string> = 
    xs['length'] extends N ? xs : never;

const cc5: LengthIs<16, `0000-0000-0000-0w00`> = '0000-0000-0000-0w00' satisfies CreditCardNo;  // ok!
const cc2: CreditCardNo = `0000-0000-0000`;  // not ok
const cc3: CreditCardNo = `0000-abcd-0000-0000`;  // not ok
const cc4: CreditCardNo = `0-00-000-00000`;  // mmmm, also ok