export const x = "a";

type Person = {
    name: string
}

class Self {
    constructor(
        public father?: Person, 
        public mother?: Person
    ){}

    private _oldSelf?: Person;

    get self(): Person | undefined {
        const newSelf = (this.father && this.mother) ? 
                { name: `Child of ${this.father.name} and ${this.mother.name}`} 
                : undefined;

        if (newSelf != this._oldSelf) this._oldSelf = newSelf;

        return this._oldSelf;
    }
}

function haveChild(father: Person, mother: Person): Self {
    return new Self(father, mother);
}

const father: Person = { name: 'father' };
const mother: Person = { name: 'mother' };

const timeTraveller = haveChild(father, mother);
// console.log(timeTraveller.self);


const before = timeTraveller.self;
// delete timeTraveller.father;
const after = timeTraveller.self;

// console.log(timeTraveller.self);

console.log(`timeTraveller.self has changed? ${before != after}`)
// timeTraveller.self has changed? true




