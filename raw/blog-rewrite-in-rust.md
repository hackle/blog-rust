An anecdote when talking about programming langauges. I once sumbmitted to talk to a local conference with this in the description "there are thing TypeScript can do that JavaScript cannot". The feedback I received had a question, "isn't this a bit hyperbolic considering turing completeness?" To me that's like one saying chess is more complex than tic tac toe (maybe not), and someone else goes "aren't they all about just move pieces around anyway?". So, to be absolutely clear, this post is not on the level of "turing completeness".

I've always wanted to give Rust a go, and what better time than while I also have Python and Kotlin on the plate for my day job (Nervous laughter)?

This blog was previously written in Haskell without using a web framework. Make no mistake, that worked a charm, and this rewrite doesn't take away my affection for Haskell. And I will most definitely be doing another rewrite in Haskell - with a web framework.

Big caveats, I have never done systems programming in anger; and arguably rewriting a blog, as web service in nature, is not the exemplary use of Rust. But do note I would never consider a rewrite in C or C++, considering the comparisons made against these two fairly classical systems languages. Also, it's a super simple project concerned with serving markdowns over HTML.

One thing is quite clear - Rust is not like any other language I've used. There are moments of joy and others of frustration, especially with async and Future.

I went in with "systems" always in mind, thinking that would be enough to prepare me for any oddness - after all, what could possibly be that different? Turns out I couldn't have been more wrong.

A welcoming sight for a Haskell aficionados is immutability as default, and the presence of proper union types  in the form of enum. Look here, Kotlin, Go! It's not that hard for a systems language, what's your excuses? 

# lifetime, wow!

Quite encouragingly, iterators are centre-stage these days in most languages, leading to increasing popularity of declarative data-driven programming versus imperative for loops.

Consider [this](https://play.kotlinlang.org/#eyJ2ZXJzaW9uIjoiMS41LjMxIiwicGxhdGZvcm0iOiJqYXZhIiwiYXJncyI6IiIsIm5vbmVNYXJrZXJzIjp0cnVlLCJ0aGVtZSI6ImlkZWEiLCJjb2RlIjoiLyoqXG4gKiBZb3UgY2FuIGVkaXQsIHJ1biwgYW5kIHNoYXJlIHRoaXMgY29kZS4gXG4gKiBwbGF5LmtvdGxpbmxhbmcub3JnIFxuICovXG5cbmZ1biBtYWluKCkge1xuICAgIHZhbCBudW1iZXJzID0gbGlzdE9mKFwib25lXCIsIFwidHdvXCIsIFwidGhyZWVcIiwgXCJmb3VyXCIpXG4gICAgdmFsIG51bWJlcnNJdGVyYXRvciA9IG51bWJlcnMuaXRlcmF0b3IoKVxuICAgIFxuICAgIC8vIHRoaXMgcHJpbnRzIHRoZSBudW1iZXJzXG4gICAgbnVtYmVyc0l0ZXJhdG9yLmZvckVhY2goeyBwcmludGxuKGl0KSB9KVxuICAgIFxuICAgIC8vIHRoaXMgcHJpbnRzIG5vdGhpbmdcbiAgICBudW1iZXJzSXRlcmF0b3IuZm9yRWFjaCh7IHByaW50bG4oaXQpIH0pXG59In0=) example in Kotlin, there is but a small nit-pick.

```kotlin
fun main() {
    val numbers = listOf("one", "two", "three", "four")
    val numbersIterator = numbers.iterator()
    
    // this prints the numbers
    numbersIterator.forEach({ println(it) })
    
    // this prints nothing
    numbersIterator.forEach({ println(it) })
}
```

One would say: yeah sure, the iterator has reached its end! Correctly so, but can the language tell us that? For more complex code, I would like to be warned or stopped from the meaningless iteration. This innocuous question has no answer at all in most languages, except ones like Rust that implement this concept of how a value is "used up". In this case, being moved. 

(In C#, peopls are not advised to use iterators directly, instead `IEnumerable` hides the complexity and can be enumerated over and over (despite the performance loss and being purpose defeating). Stop signs (albeit smart ones) as workarounds, not as solutions.)

Let's look at this in Rust,

```rust
fn main() {
    let numbers = vec![1,2,3];
    let itr = numbers.iter();
    itr.for_each(|n| print!("{:?}", n));
    itr.for_each(|n| print!("{:?}", n));
}
```

The above code gives an error,

```rust
error[E0382]: use of moved value: `itr`
 --> main.rs:5:5
  |
3 |     let itr = numbers.iter();
  |         --- move occurs because `itr` has type `std::slice::Iter<'_, i32>`, which does not implement the `Copy` trait
4 |     &itr.for_each(|n| print!("{:?}", n));
  |      --- value moved here
5 |     itr.for_each(|n| print!("{:?}", n));
  |     ^^^ value used here after move
```

Ah, the iterator has been moved when `for_each` is called, so it cannot be iterated over again. HOW ABOUT THAT!

In my opinion this really pushes the envelop of programming languages and its the subject of envy for `Haskell` which wasn't too shy to follow up with its own implementation of affine / linear types (as they are called).

# Function but not too much

As a proud functional programmer I didn't hesitate before reaching out to functions, but soon I found Rust does not exactly make this easy.

First of all, there is a clear distinction between functions and closures, at least to the programmer (I am fairly sure compilers have a harder time with closures than plain function pointers). Because closures capture environment values, and the values have their own lifetime, it's imperative that closures respect that - aha, so we get to choose between FnOnce vs Fn. Completely obvious! I thought. Then it bit me hard immediately.

## syntax what?

A function is defined as,

```rust
fn foo(arg1: String) -> i32 {...}
```

And its type can be written as `Fn(String) -> i32`. So far so good. How should a lambda (closure) look like? Well, it'll be `|num| num * 2`. 

It doesn't stop here, pattern matching / case split takes another form,

```rust
match (a, b) {
  (None, None)  => "Both missing",
  (_, _)        => "Something is there",
}
```

Come on, make up your mind! (Ok I am sure there are good reasons for these decisions but seriously was it really necessary to be this confusing?)


## closure and lifetime

Consider this innocuous example for any functional programmer,

```rust
fn main() {
  println!("{:?}", greet()("world"));
}

fn greet() -> impl Fn(&str) -> String {
  let prefix = "hello! ";
  |name: &str| format!("{:?} {:?}", prefix, name)
}
```

This produces a pretty scary error.

```rust
error[E0373]: closure may outlive the current function, but it borrows `prefix`, which is owned by the current function
 --> main.rs:7:3
  |
7 |   |name: &str| format!("{:?} {:?}", prefix, name)
  |   ^^^^^^^^^^^^                      ------ `prefix` is borrowed here
  |   |
  |   may outlive borrowed value `prefix`
  |
note: closure is returned here
 --> main.rs:5:15
  |
5 | fn greet() -> impl Fn(&str) -> String {
  |               ^^^^^^^^^^^^^^^^^^^^^^^
help: to force the closure to take ownership of `prefix` (and any other referenced variables), use the `move` keyword
  |
7 |   move |name: &str| format!("{:?} {:?}", prefix, name)
```

But the suggestion is also very clear: `prefix` cannot be used in the returned closure as it does not live long enough to match the lifetime of the closure (which is to be used by the caller who may decide when to use the closure). The fix is fairly simple in this case, we need to follow the error message and make the closure `move |name: &str| format!("{:?} {:?}", prefix, name)`. Rust is bossy, and I must listen.

## closure == closure? No such thing

How about returning functions (closures, you know) of the same type? Consider this curried `double_or_nothing` function,

```rust
fn double_or_nothing(double: bool) -> impl Fn(i32) -> i32 {
  return if double {
    |n| n * 2
  } else {
    |_| 0
  }
}
```

Rust does not like it, albeit the obviously harmless and "correct" definition. It complains,

```rust
error[E0308]: `if` and `else` have incompatible types
  --> main.rs:9:5
   |
6  |     return if double {
   |  __________-
7  | |     |n| n * 2
   | |     --------- expected because of this
8  | |   } else {
9  | |     |_| 0
   | |     ^^^^^ expected closure, found a different closure
10 | |   }
   | |___- `if` and `else` have incompatible types
   |
   = note: expected type `[closure@main.rs:7:5: 7:14]`
           found closure `[closure@main.rs:9:5: 9:10]`
   = note: no two closures, even if identical, have the same type
   = help: consider boxing your closure and/or using it as a trait object
```

The error message should be self-explanatory. The fix is rather non-trivial (for me) to explain, but in a nutshell we must box the closure so they are of a pointer type. Althought it does not change the calling code - read up on the `Box<T>` type and you'll get the glorious details.

```rust
fn main() {
  println!("{:?}", double_or_nothing(true)(2));
}

fn double_or_nothing(double: bool) -> Box<dyn Fn(i32) -> i32> {
  return if double {
    Box::new(|n| n * 2)
  } else {
    Box::new(|_| 0)
  }
}
```

## async and sync don't easily splice

This section is mostly a rant.

If you have not been put off using functions yet, surely `async / await` and `Future` will. To start off, `Rocket`, the web framework I use for this blog, does not allow blocking http request, at least with the `reqwest` crate (library) I am using. This is great for best practices but it took me a while to get [the tell-off](https://rust-lang.github.io/async-book/01_getting_started/03_state_of_async_rust.html#compatibility-considerations) that it's not the easiest to combine async and sync code. 

Now this does not really surprise me that much - C# enforces that pretty well, if not at the language level, the community does a great job at promoting the idea "async all the way". So I have reasons to believe this is a good thing. (I am also not a fan of NOT colouring my functions.)

I had the toughest time trying to return something like `impl Fn() -> Future<Output=String>`. First of all this is not valid syntax, it needs to be `impl Fn() -> impl Future<Output=String>` but nested `impl`s are not allowed so a type alias needs to be created for the `Future` type.

Then in no uncertain terms it's made clear that a closure that returns a `Future` only allows `async move |x| ...`, which also makes sense, as threading and asynchrony is involved here. But boy was that a struggle.

The saving grace is `Rocket` supports `async` really well. One example being handlers functions can be either sync or async, and can be combined heterogenously `.mount("/", routes![health, index, blog_post])`.

For what seems to be an arbitrary decision, `async` cannot be used in traits. This again caught me off guard as I was trying to create a common "interface" for loading markdown files from one of two sources: the local file system (sync) and over HTTP (async). This is not a big problem and the alternative is a slight bit of code duplication but imagine this can be a source of annoyance if one has to deal with `async` a lot.

# struct and implementation

One looking for Object Oritented programming style would be at a loss as Rust does not really encourage sub-typing. A flavour of object orientation was provided in the form of struct impelementation where one could add methods to a data structure. This is fairly similar to that in Go, and can be roughly compared to extension methods in C# or Kotlin. Sensible.

There is also no silly notion of using a reserved key word e.g. `new` to construct an instance; one could add a `new` method in struct impelementation but that's more conventional than anything else; this `new` function would be a vanilla function and can be treated like so.

# trait magic

Trait is considered another distinguishing feature (the other being life times) and with traits there can be some mind bending beahviours with combined with type inference.

A good example is with `collect`.

It may seem fairly routine to `collect` an iterator to a `Vec`. From [documentatin](https://doc.rust-lang.org/std/iter/trait.Iterator.html#method.collect).

```rust
let a = [1, 2, 3];

let doubled: Vec<i32> = a.iter()
                         .map(|&x| x * 2)
                         .collect();
```

Remember `IEnumerable.ToList<T>() / ToArray<T>()` in C#?  

However things can get a bit dicey if we look at another example:

```rust
    let results: [Result<i32, &str>; 2] = [Ok(1), Err("Oops")];
    let easy: Vec<Result<i32, &str>> = results.iter().cloned().collect();
    println!("{:?}", easy);
    // [Ok(1), Err("Oops")]
  
    let sequenced_results: Result<Vec<_>, &str> = results.iter().cloned().collect();
    println!("{:?}", sequenced_results);
    // Err("Oops")
```

Wait what? For the exact same code `results.iter().cloned().collect()`, the returned values are of different types. Does `collect` read our minds? Of course not, and the "magic" is in how Rust was able to first infer the return type of each expression, and then use the inferred type to invoke the correct implementation of `collect` deterministically. If this is cryptic, consider the definition of `collect`:

```rust
fn collect<B>(self) -> B
where
    B: FromIterator<Self::Item>
```

So the return type is of some trait `FromIterator<T>`. Here is a telling difference: in C# / Kotlin we would define an extension method, the return type must be concrete. Whereas in Rust it's kept completely open - any type that implements `FromIterator<_>` (`Item` is mostly irrelavent here) can share the same `collect` method. Such strong type inference brings near dynamic feeling and is a reminder of Haskell's type system.

Maybe slightly more intuitively the above examples can also be written as below using the so-called "turbofish" style.

```rust
let easy = results.iter().cloned().collect::<Vec<Result<i32, &str>>>();
let sequenced_results = results.iter().cloned().collect::<Result<Vec<_>, &str>>();
```

You'll want to read up on how this is a form of logic programming [Lowering Rust traits to logic](http://smallcultfollowing.com/babysteps/blog/2017/01/26/lowering-rust-traits-to-logic/) and some more great examples here [on traits and polymorphism](https://stanford-cs242.github.io/f18/lectures/05-2-rust-traits.html#:~:text=In%20Rust%2C%20polymorphic%20functions%20are,gave%20it%20the%20wrong%20type.)


# summary
In summary, it was no mean feat to get a small web app working, and there were plenty of eye-opening moments on the way.

As it stands, the best route for me with Rust is to intentionally structure my solutions around the dark corners such as complex closures and Futures. If I can manage that, then there should be plenty of joy to have.