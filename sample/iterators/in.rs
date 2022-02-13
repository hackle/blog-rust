fn main() {
    let numbers = vec![1,2,3];
    numbers.iter().for_each(|n| print!("{?:}", n));
}

main();