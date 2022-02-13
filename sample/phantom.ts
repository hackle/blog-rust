type Phantom<T, P> = T;
type CustomerId = Phantom<number, 'CustomerId'>;
type ProductId = Phantom<number, 'ProductId'>;

const customerId: CustomerId = 3 as CustomerId;
const productId: ProductId = customerId + 5;

type VariadicFn<U> = <T extends never[]>(...ts: T) => U;

const toStr: VariadicFn<string> = (n: number, b: boolean, c: string) => `${n} ${b} ${c}`;

