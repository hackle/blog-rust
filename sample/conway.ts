/**
 * to use please mention @hacklew https://github.com/hackle
 * 
 * Conway's game of life in TYPEScript - the logic of the game is mostly encoded in types
 */

const len: [number, string]['length'] = 2;
const lenIs2: [number, string]['length'] extends 2 ? true : false = true;

/** 
 * First we need Peano numbers for free transformation between types <-> number
*/
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
// const minus4: Minus<2, 3> = never

type Plus<N1 extends number, N2 extends number> = 
    [...Peano<N1>, ...Peano<N2>]['length'] extends infer R extends number 
    ? R 
    : never;

const add1: Plus<1, 4> = 5;
const add2: Plus<0, 4> = 4;
const num3: number = add2;

/**
 * Game stuff begins
 */
type CountAlive<Xs extends unknown[], Alive> = 
    Xs extends []
    ? []
    : Xs extends [infer X, ...infer Rest]
        ? Eq<X, Alive> extends true
            ? [X, ...CountAlive<Rest, Alive>]
            : CountAlive<Rest, Alive>
        : [];

const onlyTrue1: CountAlive<['x', undefined, 'x', ' ', null], 'x'> = ['x', 'x'];
const neverEx: never extends boolean ? true : false = true;
const undefinedEx: undefined extends boolean ? true : false = false;
const onlyTrue2: CountAlive<[true, never], true> = [true];

type ValueAt<T, Coords extends T[][], 
    R extends number | never,
    C extends number | never, 
> = C extends never // must check never first as "never extends number" succeeds
    ? never
    : R extends never
        ? never
        : Coords[R][C];

const coords1: [[true], [true]][0][0] = true; 
const coords2: [[true], [true]][never][0] = true; 
const coords3: [[true], [true]][never][never] = true; 
const coords4: [[false], [false]][never][never] = false; 
const coords5: [[false], [true]][1][never] = true; 
// const coords6: [[true], [true]][1][1] = undefined; 

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


type Neighbours<
    T, 
    Coords extends T[][], 
    R extends number, 
    C extends number
>
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
    
type AliveNeighbours<
    Alive, 
    Dead, 
    Coords extends (Alive | Dead)[][], 
    R extends number, 
    C extends number
> = 
    CountAlive<Neighbours<(Alive | Dead), Coords, R, C>, Alive> extends infer ToAlive extends any[]
    ? ToAlive['length']
    : never;

const liveNeigbours1: AliveNeighbours<'x', ' ', [], 0, 0> = 0;

const liveNeigbours2: AliveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 1, 1> = 8;

const liveNeigbours2a: AliveNeighbours<'x', ' ', [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
], 1, 1> = 0;

const liveNeigbours3: AliveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 3;

const liveNeigbours3a: AliveNeighbours<'x', ' ', [
    ['x', ' ', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0, 0> = 2;

const liveNeigbours4: AliveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 2, 2> = 3;

const liveNeigbours5: AliveNeighbours<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 1, 0> = 5;

const liveNeigbours6: AliveNeighbours<true, false, [
    [true, true, true],
    [true, true, true],
    [true, true, true]
], 0, 1> = 5;

type MapOneCell<
    Alive,
    Dead,
    Coords extends (Alive | Dead)[][], 
    R extends number,
    C extends number,
> = AliveNeighbours<Alive, Dead, Coords, R, C> extends infer Nc extends number
    ? Eq<Nc, 3> extends true
        ? Alive
        : Eq<Nc, 2> extends true
            ? Eq<ValueAt<(Alive | Dead), Coords, R, C>, Alive> extends true
                ? Alive
                : Dead
            : Dead
    : Dead;

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
    Alive,
    Dead,
    Coords extends (Alive | Dead)[][], 
    R extends number,
    C extends number = 0,
> = Gte<C, Coords[R]['length']> extends true
    ? []
    : [ MapOneCell<Alive, Dead, Coords, R, C>, ...MapOneRow<Alive, Dead, Coords, R, Plus<C, 1>> ]

const mapOneRow0: MapOneRow<'x', ' ', [], 0, 0> = [];

const mapOneRow1: MapOneRow<'x', ' ', [
    ['x', 'x', 'x'],
    ['x', 'x', 'x'],
    ['x', 'x', 'x']
], 0> = ['x', ' ', 'x'];

const mapOneRow2: MapOneRow<'x', ' ', [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' ']
], 0> = [' ', ' ', ' '];

type Next<
    Alive,
    Dead,
    Coords extends (Alive | Dead)[][],
    R extends number = 0
> = Gte<R, Coords['length']> extends true
    ? []
    : [MapOneRow<Alive, Dead, Coords, R>, ...Next<Alive, Dead, Coords, Plus<R, 1>>]

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

/**
 * A game runner with 'x' | '.' and utilities for parse and display
 */

type Cell = 'x' | '.';
type ParseRow<Row extends string> = 
    Row extends ''
    ? []
    : Row extends `${infer X extends Cell}${infer Rest extends string }`
        ? [X, ...ParseRow<Rest>]
        : never;

const parseRow1: ParseRow<'x.x.x'> = ["x", ".", "x", ".", "x"];

type Parse<
    Input extends string
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
    : Row extends [infer X extends Cell, ...infer Rest extends Cell[]]
        ? `${X}${SerializeRow<Rest>}`
        : never;

const serializeRow0: SerializeRow<[]> = '';
const serializeRow1: SerializeRow<['x', '.', 'x', '.', 'x']> = 'x.x.x';

type Serialize<T extends Cell[][]> =
    T extends []
    ? '\n'
    : T extends [infer X extends Cell[], ...infer Rest extends Cell[][]]
        ? `${SerializeRow<X>}\n${Serialize<Rest>}`
        : never;

const serialize0: Serialize<[]> = '\n';
const serialize1: Serialize<[['x', '.', 'x'], ['.', 'x', '.']]> = 
`x.x
.x.

`;

type Move<T extends Cell[][]> = Next<'x', '.', T>;
const move1: Move<typeof parse1> = [["x", ".", "x"], [".", ".", "."], ["x", ".", "x"]];

type Play<T extends Cell[][], MaxMoves extends number> =
    MaxMoves extends 0
    ? []
    : Move<T> extends infer N extends Cell[][]
        ? [Serialize<N>, ...Play<N, Minus<MaxMoves, 1>>]
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

/**
 * Let's have a slider
 */

/** initial state of the game  */
type Slider = 
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

/** 
 * 20 moves are captured in an array
 * the values are enforced by types!
 * with VS Code I just used auto-completion
 */
const slider: Play<Parse<Slider>, 20> = [
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

/**
 * show the slider in animation
 */
animateGame(slider);

function animateGame(gameSnapshots: string[], idx: number = 0) {
    if (!slider[idx]) return;

    console.clear();
    console.log(slider[idx]);

    setTimeout(() => {
        animateGame(gameSnapshots, idx+1);
    }, 200);
}