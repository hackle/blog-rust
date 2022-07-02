var lt1 = true;
var lt2 = true;
var lt3 = false;
var gt1 = false;
var gt2 = true;
var gt3 = true;
var minus1 = 1;
var minus2 = 14;
var minus3 = 0;
var add1 = 5;
var add2 = 4;
var num3 = add2;
var onlyTrue1 = ['x', 'x'];
var neverEx = true;
var undefinedEx = false;
var onlyTrue2 = [true];
var coords1 = true;
var coords2 = true;
var coords3 = true;
var coords4 = false;
var coords5 = true;
var coords6 = undefined;
(function () {
    var _never = (function () { throw new Error(); })();
    var valueAt1 = true;
    var valueAt2 = _never;
    var valueAt3 = _never;
    var valueAt4 = _never;
    var valueAt5 = _never;
    var valueAt6 = undefined;
    var valueAt7 = undefined;
});
(function () {
    var _never = (function () { throw new Error(); })();
    var neighbours0 = [
        _never, _never, _never,
        _never, _never,
        _never, _never, _never
    ];
    var neighbours1 = [
        _never, _never, _never,
        _never, _never,
        _never, true, _never
    ];
    var neighbours2 = [
        true, true, true,
        true, true,
        true, true, true,
    ];
});
var liveNeigbours1 = 0;
var liveNeigbours2 = 8;
var liveNeigbours2a = 0;
var liveNeigbours3 = 3;
var liveNeigbours3a = 2;
var liveNeigbours4 = 3;
var liveNeigbours5 = 5;
var liveNeigbours6 = 5;
var mapOneCell1 = ' ';
var mapOneCell2 = 'x';
var mapOneCell3 = ' ';
var mapOneCell3a = ' ';
var mapOneCell4 = 'x';
var mapOneRow0 = [];
var mapOneRow1 = ['x', ' ', 'x'];
var mapOneRow2 = [' ', ' ', ' '];
var next0 = [];
var next1 = [[' ', 'x', ' ']];
var next2 = [[' ', ' ', ' ']];
var next3 = [[' ', ' ', ' ']];
var next4 = [
    ['x', ' ', 'x'],
    [' ', ' ', ' '],
    ['x', ' ', 'x']
];
var parseRow1 = ["x", ".", "x", ".", "x"];
var parse1 = [["x", "x", "x"], ["x", "x", "x"], ["x", "x", "x"]];
var serializeRow0 = '';
var serializeRow1 = 'x.x.x';
var serialize0 = '\n';
var serialize1 = "x.x\n.x.\n\n";
var move1 = [["x", ".", "x"], [".", ".", "."], ["x", ".", "x"]];
var play0 = ["\n", "\n", "\n", "\n", "\n"];
var play1 = [
    "x.x\n...\nx.x\n\n",
    "...\n...\n...\n\n",
    "...\n...\n...\n\n",
    "...\n...\n...\n\n",
    "...\n...\n...\n\n",
];
var slider = [
    ".x........\n..x.......\nxxx.......\n..........\n..........\n..........\n..........\n..........\n..........\n..........\n\n",
    "..........\nx.x.......\n.xx.......\n.x........\n..........\n..........\n..........\n..........\n..........\n..........\n\n",
    "..........\n..x.......\nx.x.......\n.xx.......\n..........\n..........\n..........\n..........\n..........\n..........\n\n",
    "..........\n.x........\n..xx......\n.xx.......\n..........\n..........\n..........\n..........\n..........\n..........\n\n",
    "..........\n..x.......\n...x......\n.xxx......\n..........\n..........\n..........\n..........\n..........\n..........\n\n"
];
