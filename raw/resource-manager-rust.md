Advancements in programming languages are known to greatly simply solutions to existing complex problems, sometimes turning them into trivial problems. Maybe the most well known example is null safety: by rooting out the ambiguity that any objects can be null from the language level, a class of bugs is removed, and programmers are freed from the anxiety and unnecessary burden of being "defensive" at runtime.

More advanced examples include discretionary use of expressive typing that can go a long way towards ensuring safety from compile time, even if types are erased and non-existent at runtime. TypeScript is a revolutionary force in this regard: its typing power is unparalleled in the mainstream, enabling programmer to express constraints on the type level as never seen before: flexible manipulation of types to combine two types into one, to _surgically_ remove or swap out a field from one type to make another, or to build a result type by analysing input types. What dreams are made of.

My good friend [DT_Bindi](https://twitter.com/DT_Bindi) raised a problem that is not solved to complete satisfaction in most languages, but is so in Rust, almost trivially: resource management. Or, ensuring resources are cleaned up after allocation, and doing so on with assurance on the language level, not deferring to the runtime.

This problem is solved with `IDisposable` in C# or Context Manager in Python, both may be traced back to RAII (Resource Acquisition Is Initialisation) in C++ (Whether that's the source of inspiration, I have no way of knowing).

```CSharp
class WithResources : IDisposable
{
    bool disposed = false;
    public WithResources()
    {
        Console.WriteLine("Resources are allocated. Must clean up!");
    }

    public void DoSomething()
    {
        if (this.disposed)
        {
            throw new Exception("Bad call! Resources have been released!");
        }

        Console.WriteLine("Did something with resources.");
    }

    public void Dispose()
    {
        this.disposed = true;
        Console.WriteLine("Resource are disposed!");
    }
}

using (var wr = new WithResources())
{
    wr.DoSomething();
    wr.DoSomething();
}
// output:
// Resources are allocated. Must clean up!
// Did something with resources.
// Did something with resources.
// Resource are disposed!
```

The example shows _well-behaved_ usage, in other word, by a savvy programmer who knows the conventions and sticks to them. In this case, there are 2 rules,

1. construct the instance of `WithResources` in the `using` statement
2. place the method call to `wr.DoSomething` (that relies on resources) within the `using` block

However, not all programmers are equally savvy, or convention-following, nor are all usages are conventional. For example, a creative usage may be as follows.

```CSharp
var wr3 = new WithResources();
wr3.DoSomething();
using (wr3) {}
// output:
// Resources are allocated. Must clean up!
// Did something with resources.
// Resource are disposed!
```

Ah, so `wr3.DoSomething()` does not have to be placed in a `using` block! This is because `using` only really ensures the `Dispose` method is called when the block exits, there is no action taken when the block is entered. By comparison, a context manager in Python has both `__enter__` and `__exit__` methods, enforced by a block starting with the `with` keyword.

But if `wr3.DoSomething()` an be called outside of the `using` block, then it's entirely possible that it's used without it. The compiler does not reject the code, and "resource leak" takes place silently. Not ideal.

One may also write misbehaving code as follows,

```CSharp
var wr2 = new WithResources();
using (wr2) {}
wr2.DoSomething();
// System.Exception: Bad call! Resources have been released!
```

There is no complaints from the compiler, but at runtime, an exception is thrown because `wr2.DoSomething()` is called AFTER the resources are disposed of. 

The savvy programmer will say, "Duh! It's common sense that `wr2` must be used within the `using` block!" But that's unhelpful. How do I know the current object requires resource clean-up? One answer would be: you know it be convention. Files, streams, network objects, etc. Which is not good enough - if I don't know, I don't. Why can't the language enforce it?

Let's summarise the problem in two key points,

1. resource clean-up ("release") must happen
2. objects and methods that depend on the resources cannot be used AFTER clean-up

The `using` statement in C#, or `with` statement in Python, or `use` extension function in Kotlin only really solves the first problem partially by convention, which falls in the "hope is the strategy" bucket.

In other languages, this pattern that a pair of functions must be invoked in certain order is also called "bracketing". See what's on [wiki.haskell.org](https://wiki.haskell.org/Bracket_pattern). To the (modest) limit of my Haskell knowledge, there is yet a satisfying solution to this problem (nothing that compares to what Rust has to follow as below).

We know garbage-collection-empowered languages free up memory automatically, so why can't the same be done with resources? This is usually due to one characteristic of the garbage collector: it usually acts on its own pace, so there is no guarantee WHEN clean-up takes place; of course it's always possible to invoke garbage collection manually, but in general this is frowned upon for performance or correctness implications.

Even if we can utilise a similar mechanism to GC, there is still the problem of rejecting resource usage after clean-up, this is where the vast majority of languages throw in the towel, except Rust.

Rust is reputed for incorporating ownership into the type system, so the language is able to track and enforce safe use of an object (and its internal data and resources); more remarkably, with ownership it is possible to check that an object should NOT be used AFTER it's "dropped".

This may sound like cuckoo talk, but not so if we see some Rust code.

```Rust
struct WithResources {
    released: bool,
    resources: String,
}

impl WithResources {
    fn new() -> WithResources {
        WithResources { 
            released: false,
            resources: String::from("Resources"),
        }
    }
    
    fn do_something(&self) {
        // this check is superfluous
        if self.released {
            panic!("Resources have been released!")
        }
        
        println!("Did something with {}.", self.resources);
    }
}

impl Drop for WithResources {
    fn drop(&mut self) {
        // this mutation is superfluous
        self.released = false;
        
        println!("Resources are released.");
    }
}

fn main() {
    let wr = WithResources::new();
    wr.do_something();
}
// outputs:
// Did something with Resources.
// Did something with Resources.
// Resources are released.
```

Innocuous enough, but that's the big difference to the C# code? It is the lack of `using` (or `with` for that matter). The `Drop` trait ensures resource clean-up is called when `wr` goes out of scope. For not using a garbage collector, the `drop` method is also guaranteed to be invoked deterministically. 

Note the two lines of code I marked as "superfluous"? This is because they should never come into use. Well, only if I explicitly call "drop". In the below code, I try to do something fishy - to continue use `wr` after it's been "dropped" manually. As expected, Rust rejects this foul play.

```Rust
let wr = WithResources::new();
wr.do_something();
wr.do_something();

drop(wr);
wr.do_something();

// error[E0382]: borrow of moved value: `wr`
//   --> src/main.rs:39:5
//    |
// 34 |     let wr = WithResources::new();
//    |         -- move occurs because `wr` has type `WithResources`, which does not implement the `Copy` trait
// ...
// 38 |     drop(wr);
//    |          -- value moved here
// 39 |     wr.do_something();
//    |     ^^ value borrowed here after move
```

This very comprehensive error message is roughly saying: `wr` has been consumed ("dropped") and can no longer be used.

It's worth noting for `wr` to be consumed is a bread-and-butter operation in Rust, there is zero magic involved. We would have written our own function `my_drop` to the same effect. The difference is `drop`, as part of the `Drop` trait, will be called by the language automatically.

```Rust
fn my_drop(_: WithResources) { }

// later
my_drop(wr);
wr.do_something();
// same error
// error[E0382]: borrow of moved value: `wr`
// ...
```

What's more, I am no Rust expert, so the fact that I can understand and appreciate the workings is all the more evidence to the brilliance of such ideas and Rust's implementation.