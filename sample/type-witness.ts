type AmPm = 'Am' | 'Pm';

function ap<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}

// const am: "Am"
const am = ap('Am');

function ap1<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        return val;
    }

    return val;
}

function ap2(val: AmPm): AmPm {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}

function ap4<T extends AmPm>(val: T): T {
    if (val === 'Am') {
        // const result: "Am"
        const result = (a => a)(val);

        return result;  // same error
    }

    return val;
}


function ap5(val: AmPm) {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}

// const returnOfAp5: "Am" | "Pm"
declare const returnOfAp5: ReturnType<typeof ap5>;



function ap6(val: 'Am'): 'Am';
function ap6(val: 'Pm'): 'Pm';
function ap6(val: AmPm): AmPm {
    if (val === 'Am') {
        return 'Am';
    }

    return 'Pm';
}

// const am6: "Am"
const am6 = ap6('Am');

function ap7<T extends AmPm>(
    val1: T,
    val2: T,
): T {
    if (val1 === 'Am') {
        return val2;
    }

    return val1;
}


function ap8<T extends AmPm>(
    val1: T,
    val2: T,
): T {
    const vals: [T, T] = [val1, val2];
    switch (vals) {
        case ['Am', 'Am']: return 'Am';
        case ['Pm', 'Pm']: return 'Pm';
        // ...
    }
}