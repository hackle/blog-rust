type Peano<N extends number, Aggr extends any[] = []> = 
    Aggr['length'] extends N ? Aggr : Peano<N, [1, ...Aggr]>;

type Eq<T1, T2> = 
    [T1] extends [T2] 
    ? [T2] extends [T1] 
        ? true 
        : false 
    : false;

type Lte<N1 extends number, N2 extends number> = Peano<N2> extends [...Peano<N1>, ...infer _] ? true : false;
type Gte<N1 extends number, N2 extends number> = Peano<N1> extends [...Peano<N2>, ...infer _] ? true : false;

const lt1: Lte<1, 2> = true;
const lt2: Lte<2, 2> = true;
const lt3: Lte<3, 2> = false;

const gt1: Gte<1, 2> = false;
const gt2: Gte<2, 2> = true;
const gt3: Gte<3, 2> = true;

type Minus<N1 extends number, N2 extends number> = 
    Peano<N1> extends Peano<N2>
    ? 0 
    : Peano<N1> extends [...Peano<N2>, ...infer Rest] 
        ? Rest['length'] 
        : never;

const minus1: Minus<3, 2> = 1;
const minus2: Minus<16, 2> = 14;
const minus3: Minus<2, 2> = 0;
// const minus4: Minus<2, 3> = 

type Plus<N1 extends number, N2 extends number> = 
    [...Peano<N1>, ...Peano<N2>]['length'] extends infer R
    ? R extends number 
        ? R : never
        : never;

const add1: Plus<1, 4> = 5;
const add2: Plus<0, 4> = 4;
const num3: number = add2;

type CountLive<Xs extends unknown[], T> = 
    Xs extends []
    ? []
    : Xs extends [infer X, ...infer Rest]
        ? Eq<X, T> extends true
            ? [X, ...CountLive<Rest, T>]
            : CountLive<Rest, T>
        : [];

const onlyTrue1: CountLive<['x', undefined, 'x', ' ', null], 'x'> = ['x', 'x'];
const neverEx: never extends boolean ? true : false = true;
const undefinedEx: undefined extends boolean ? true : false = false;
const onlyTrue2: CountLive<[true, never], true> = [true];

type ValueAt<T, Coords extends T[][], 
    R extends number | never,
    C extends number | never, 
> = C extends never
    ? never
    : R extends never
        ? never
        : Coords[R][C];

const coords1: [[true], [true]][0][0] = true; 
const coords2: [[true], [true]][never][0] = true; 
const coords3: [[true], [true]][never][never] = true; 
const coords4: [[false], [false]][never][never] = false; 
const coords5: [[false], [true]][1][never] = true; 
const coords6: [[true], [true]][1][1] = undefined; 

(() => {
    const _never = (() => { throw new Error(); })();
    const valueAt1: ValueAt<boolean, [[true], [true]], 0, 0> = true; 
    const valueAt2: ValueAt<boolean, [[true], [true]], never, 0> = _never; 
    const valueAt3: ValueAt<boolean, [[true], [true]], never, never> = _never; 
    const valueAt4: ValueAt<boolean, [[false], [false]], never, never> = _never; 
    const valueAt5: ValueAt<boolean, [[false], [true]], 1, never> = _never; 
    const valueAt6: ValueAt<boolean, [[false], [true]], 1, 1> = undefined; 
    const valueAt7: ValueAt<boolean, [[false], [true]], 2, 2> = undefined; 
});


type Neighbours<T, Coords extends T[][], R extends number, C extends number>
    = [
        ValueAt<T, Coords, Minus<R, 1>, Minus<C, 1>>,
        ValueAt<T, Coords, Minus<R, 1>, C>,
        ValueAt<T, Coords, Minus<R, 1>, Plus<C, 1>>,
        ValueAt<T, Coords, R, Minus<C, 1>>,
        ValueAt<T, Coords, R, Plus<C, 1>>,
        ValueAt<T, Coords, Plus<R, 1>, Minus<C, 1>>,
        ValueAt<T, Coords, Plus<R, 1>, C>,
        ValueAt<T, Coords, Plus<R, 1>, Plus<C, 1>>,
    ];

(() => {
    const _never = (() => { throw new Error(); })();
    const neighbours0: Neighbours<any, [], 0, 0> = [
        _never, _never, _never, 
        _never,         _never,
        _never, _never, _never
    ];
    const neighbours1: Neighbours<boolean, [[true],[true]], 0, 0> = [
        _never, _never, _never,
        _never,         _never, 
        _never, true,  _never
    ];

    const neighbours2: Neighbours<boolean, 
        [
            [true, true, true],
            [true, true, true],
            [true, true, true]
        ], 
        1, 1
    > = [
        true, true, true,
        true,       true,
        true, true, true,
    ];
});
    
type LiveNeighbours<Live, Die, Coords extends (Live | Die)[][], R extends number, C extends number> = 
    CountLive<Neighbours<(Live | Die), Coords, R, C>, Live> extends infer ToLive
    ? ToLive extends any[]
        ? ToLive['length']
        : never
    : never;

const liveNeigbours1: LiveNeighbours<'x', ' ', [], 0, 0> = 0;

const liveNeigbours2: LiveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 1, 1> = 8;

const liveNeigbours2a: LiveNeighbours<'x', ' ', [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
], 1, 1> = 0;

const liveNeigbours3: LiveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 3;

const liveNeigbours3a: LiveNeighbours<'x', ' ', [
    ['x', ' ', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 2;

const liveNeigbours4: LiveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 2, 2> = 3;

const liveNeigbours5: LiveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 1, 0> = 5;

const liveNeigbours6: LiveNeighbours<true, false, [
    [true, true, true],
    [true, true, true],
    [true, true, true]
], 0, 1> = 5;

type MapOneCell<
    Live,
    Die,
    Coords extends (Live | Die)[][], 
    R extends number,
    C extends number,
> = LiveNeighbours<Live, Die, Coords, R, C> extends infer Nc
    ? Nc extends number
        ? Eq<Nc, 3> extends true
            ? Live
            : Eq<Nc, 2> extends true
                ? Eq<ValueAt<(Live | Die), Coords, R, C>, Live> extends true
                    ? Live
                    : Die
                : Die
        : Die
    : Die;

const mapOneCell1: MapOneCell<'x', ' ', [['x']], 0, 0> = ' ';

const mapOneCell2: MapOneCell<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 'x';

const mapOneCell3: MapOneCell<'x', ' ', [
    ['x', ' ', 'x'],
    [' ', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = ' ';

const mapOneCell3a: MapOneCell<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 1> = ' ';

const mapOneCell4: MapOneCell<'x', ' ', [
    ['x', ' ', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 'x';

type MapOneRow<
    Live,
    Die,
    Coords extends (Live | Die)[][], 
    Row extends unknown[],
    R extends number,
    C extends number = 0,
> = Row extends []
    ? []
    : Row extends [infer _, ...infer Rest]
        ? Rest extends unknown[] 
            ? [ MapOneCell<Live, Die, Coords, R, C>, ...MapOneRow<Live, Die, Coords, Rest, R, Plus<C, 1>> ]
            : never
        : never;

const mapOneRow0: MapOneRow<'x', ' ', [], [], 0> = [];

const mapOneRow1: MapOneRow<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], ['x', 'x', 'x'], 0> = ['x', ' ', 'x'];

const mapOneRow2: MapOneRow<'x', ' ', [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
], [undefined, undefined, undefined], 0> = [' ', ' ', ' '];

type Next<
    Live,
    Die,
    Coords extends (Live | Die)[][],
    Cur extends unknown[][] = Coords,
    R extends number = 0
> = Cur extends []
    ? []
    : Cur extends [infer Row, ...infer Rest]
        ? Row extends unknown[]
            ? Rest extends unknown[][]
                ? [MapOneRow<Live, Die, Coords, Row, R>, ...Next<Live, Die, Coords, Rest, Plus<R, 1>>]
                : never
            : never
        : never;

const next0: Next<'x', ' ', []> = [];

const next1: Next<'x', ' ', [
    ['x', 'x', 'x']
]> = [[' ', 'x', ' ']];

const next2: Next<'x', ' ', [
    ['x', ' ', 'x']
]> = [[' ', ' ', ' ']];

const next3: Next<'x', ' ', [
    [' ', ' ', ' ']
]> = [[' ', ' ', ' ']];

const next4: Next<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
]> = [
    ['x', ' ', 'x'],
    [' ', ' ', ' '],
    ['x', ' ', 'x']
];

type Cell = 'x' | '.';
type ParseRow<Row extends string> = 
    Row extends ''
    ? []
    : Row extends `${infer X}${infer Rest}`
        ? X extends Cell
            ? Rest extends string 
                ? [X, ...ParseRow<Rest>]
                : never
            : never
        : never;

const parseRow1: ParseRow<'x.x.x'> = ["x", ".", "x", ".", "x"];

type Parse<
    Input = string
> = Input extends ''
    ? []
    : Input extends `${infer Row}\n${infer Rest}`
        ? [ ParseRow<Row>, ...Parse<Rest>]
        : [];

const parse1: Parse<`xxx
xxx
xxx
`> = [["x", "x", "x"], ["x", "x", "x"], ["x", "x", "x"]];

type SerializeRow<Row extends Cell[]> =
    Row extends []
    ? ''
    : Row extends [infer X, ...infer Rest]
        ? X extends Cell
            ? Rest extends Cell[]
                ? `${X}${SerializeRow<Rest>}`
                : never
            : never
        : never;

const serializeRow0: SerializeRow<[]> = '';
const serializeRow1: SerializeRow<['x', '.', 'x', '.', 'x']> = 'x.x.x';

type Serialize<T extends Cell[][]> =
    T extends []
    ? '\n'
    : T extends [infer X, ...infer Rest]
        ? X extends Cell[]
            ? Rest extends Cell[][]
                ? `${SerializeRow<X>}\n${Serialize<Rest>}`
                : never
            : never
        : never;

const serialize0: Serialize<[]> = '\n';
const serialize1: Serialize<[['x', '.', 'x'], ['.', 'x', '.']]> = 
`x.x
.x.

`;

type Move<T extends Cell[][]> = Next<'x', '.', T>;
const move1: Move<typeof parse1> = [["x", ".", "x"], [".", ".", "."], ["x", ".", "x"]];

type Play<T extends Cell[][], Moves extends number> =
    Moves extends 0
    ? []
    : Move<T> extends infer N
        ? N extends Cell[][]
            ? [Serialize<N>, ...Play<N, Minus<Moves, 1>>]
            : never
        : never;

const play0: Play<[], 5> = ["\n", "\n", "\n", "\n", "\n"];
const play1: Play<typeof parse1, 5> = [
`x.x
...
x.x

`,
`...
...
...

`,
`...
...
...

`,
`...
...
...

`,
`...
...
...

`,
]

type slider = 
`x.........
.xx.......
xx........
..........
..........
..........
..........
..........
..........
..........
`
const slider: Play<Parse<slider>, 5> = [
`.x........
..x.......
xxx.......
..........
..........
..........
..........
..........
..........
..........

`,
`..........
x.x.......
.xx.......
.x........
..........
..........
..........
..........
..........
..........

`,
`..........
..x.......
x.x.......
.xx.......
..........
..........
..........
..........
..........
..........

`,
`..........
.x........
..xx......
.xx.......
..........
..........
..........
..........
..........
..........

`,
`..........
..x.......
...x......
.xxx......
..........
..........
..........
..........
..........
..........

`
]