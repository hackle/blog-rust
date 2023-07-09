class Rectangle0 {
    constructor(public width: number, public height: number) {}
}

class Square0 extends Rectangle0 {
    constructor(side: number) {
        super(side, side)
    }
}

const square0 = new Square0(5);
// Oh NO! height != width This is no longer a Square 
square0.height = 4;


class Rectangle1 {
    accessor width: number;
    accessor height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }
}

class Square1 extends Rectangle1 {
    constructor(side: number) {
        super(side, side)
    }

    override set width(value: number) {
        super.width = super.height = value;
    }
    override get width() { return super.width; }

    override set height(value: number) {
        super.height = super.width = value;
    }
    override get height() { return super.height; }
}

function incrementHeightOnly(rect: Rectangle1, expectedAreaIncrease: number) {
    const area0 = rect.height * rect.width;

    rect.height++;

    const area1 = rect.height * rect.width;

    if (area1 - area0 != rect.width) 
        throw Error(`Area should have increased by ${expectedAreaIncrease} not ${area1 - area0}`)
}

incrementHeightOnly(new Rectangle1(3, 5), 3);
incrementHeightOnly(new Square1(5), 5);



// class Rectangle {
//     constructor(readonly width: number, readonly height: number) {
//     }
// }

// class Square extends Rectangle {
//     constructor(readonly side: number) {
//         super(side, side);
//     }
// }

// function setWidth(rect: Rectangle, width: number): Rectangle {
//     return new Rectangle(width, rect.height);
// }

// function setHeight(rect: Rectangle, height: number): Rectangle {
//     return new Rectangle(rect.width, height);
// }

// function asSquare(rect: Rectangle): Square | null {
//     return rect.height == rect.width ? new Square(rect.width) : null;
// }

// const rect = new Rectangle(3, 8);
// const square = new Square(4);

// const square2 = setHeight(setWidth(square, 8), 8);
// console.log(square2);