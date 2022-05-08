export {};

interface Businessman<T> { 
    buys: (arg: 'money') => T;
    sells: (arg: T) => 'money';
}

interface Importer<T> extends Businessman<T> { 
   importsFrom: 'country'
}

interface Exporter<T> extends Businessman<T> {
    exportsTo: 'country'
}
