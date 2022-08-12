type BagOfData<T extends any = unknown> = {
    data: T[],
    sample: T
};

const bags: BagOfData[] = [
    {
        data: ['merry', 'xmas'],
        sample: 'it is a string'
    },
    {
        data: [101, 555],
        sample: 3
    },
    {
        data: [],
        sample: true
    },
];

function tryGetStrData(bag: BagOfData): string[] | null {
    if (typeof bag.sample === 'string') {
        return bag.data;    // error
    }

    return null;
}

function guess<T extends any = unknown>(
    val1: T,
    val2: T
): string {
    if (typeof val1 === 'string') {
        return val2;
    }

    return 'dunno';
}