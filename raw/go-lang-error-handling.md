
Let me be honest - I am not the biggest fan of Go and I possibly wouldn't choose it for my pet project. However, it doesn't mean I dislike everything about it. On the contrary, there are a few things that I like very much about Go or how it's used, driven by conventions and the community. So, I'll start off a miniseries with the simplest but maybe also the most controversial topic - error handling, summed up eloquently with this code example,

```go
result, err := foo()
if err != nil {
    return nil, err
}
```

Why is this so controversial? Because it is something in between paradigms, you may deem it pragmatic or ugly, depending on your view. This also touches on a pretty edgy area that I believe the mainstream needs significant improvement on; although Go's convention is not the best, it's definitely changing things for the better.

## Exceptions are awful

As the time of writing, the most popular error handling approach in the mainstream is exception-based, something like `try/catch/finally` that many people will find comforting.

```C#
try {
    handleValue(foo())
} catch (Exception err) {
    handleError(err)
} finally {
    cleanup()
}
```

One big advantage of exceptions is they bubble up the call stack quite conveniently; an exception thrown 10 levels deep can reach `try/catch` on the top level, without us having to worry about it, or write code to pass on the exception across the levels in between. This is why an exception can also be descriptively referred to as a "long jump".

I will appear "spoiled" to say exceptions are awful, as it's clearly superior to its predecessor of error codes or worse yet, global `errno`. However, allow me to indulge in the now and the future. 

A big problem with exception-based error handling is the difficulty of expressing explicitly that "this function and ALL its dependencies might throw these exceptions". Java made a noble effort with checked exceptions but in the end it didn't work so well, and [Kotlin throw the idea away](https://kotlinlang.org/docs/exceptions.html#checked-exceptions); as far as unchecked exceptions are concerned, a language can be tauted as "strongly-typed" but with this giant loop-hole. As programmers, we can never be fully confident, because for example,

- should all the possible exceptions be handled in the current function?
- if yes, how can I obtain a full list?
- how do I inform callers of this function, "this function is now clean"?
- if exceptions are handled selectively, how do I inform the callers, "this function is not clean, except exception A, B and C which are handled"
- if a dependency adds a new exception, or slightly changes an existing exception, our error handling is thrown off (pun intended)
- we can have a catch-all for graceful termination, but it is not always equal to meaningful handling

There you go, don't feel bad about second-guessing yourself about exception-based error-handling, it's just not meant to be a complete solution.

And sure, there are plenty of literature and best practices on how [NOT to use exceptions for control flow](https://docs.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2017/profiling/da0007-avoid-using-exceptions-for-control-flow?view=vs-2017#rule-description), but more often than not, we don't actually have a choice. 

Let us not forget, if you appreciate flat and clean code style, nested `try/catch` is a thing of beauty!

## behold value-based error-handling

From related Microsoft docs, I find another [pretty interesting section](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff647790(v=pandp.10)#use-validation-code-to-reduce-unnecessary-exceptions) with this code example suggested for the sake of efficiency.

```C#
double result = 0;
if ( divisor != 0 )
  result = numerator/divisor;
else
  result = System.Double.NaN;
```

This "validation code" idea is suspiciously reminiscent of "error code", isn't it? One problem with an error is that it can only carry so much information. `System.Double.NaN` is clear enough, but what about the context of this error? What values result in this error code? If we go down this path of thinking, it seems to lead to the invention of exceptions - and error object that encapsulates arbitrary rich information. Is this necessarily the case though?

Of course not. The key difference here is instead of being **thrown**, an exception is returned; this leads to the idea of a (typically partial) function returns **either** a value for the happy path or an error otherwise. This "either or" pattern is the essence of union types, which is the hallmark of modern type systems as is available in the likes of F#, Scala, Haskell in the form of proper union types, or Swift, Rust in the form of rich Enum types; good-enough support is provided by TypeScript, which made it all the more fascinating.

A perennial example is the `Either` type from the [Haskell wiki](https://wiki.haskell.org/Handling_errors_in_Haskell#Error_using_the_Either_type)

```Haskell
-- definition of Either is simply:
-- data Either a b  =  Left a | Right b

main = do
  line <- getLine
  case runParser emailParser line of
    Right (user,domain) -> print ("The email is OK.",user,domain)
    Left (pos,err) -> putStrLn ("Parse error on " <> pos <> ": " <> err)
```

This example from [the Rust doc](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html) is similar,

```Rust
// result
// enum Result<T, E> {
//     Ok(T),
//     Err(E),
// }

#![allow(unused)]
fn main() {
    use std::fs::File;
    use std::io::{self, Read};

    fn read_username_from_file() -> Result<String, io::Error> {
        let f = File::open("hello.txt");

        let mut f = match f {
            Ok(file) => file,
            Err(e) => return Err(e),
        };

        let mut s = String::new();

        match f.read_to_string(&mut s) {
            Ok(_) => Ok(s),
            Err(e) => Err(e),
        }
    }
}
```

It's easy to get carried away with the exhaustive pattern matching here (which is amazing in itself), but a pretty big deal here is how errors are managed: it's completed based on values; there is no long jump or unexpected stack unwind; the programmer controls how errors are handled and propagated.

Perhaps equally This section about error handling from [the Rust docs](https://doc.rust-lang.org/book/ch09-00-error-handling.html) is a pleasant read as usual. To quote,

> Rust groups errors into two major categories: recoverable and unrecoverable errors...
> Most languages don’t distinguish between these two kinds of errors and handle both in the same way, using mechanisms such as exceptions. Rust doesn’t have exceptions. Instead, it has the type Result<T, E> for recoverable errors and the panic! macro that stops execution when the program encounters an unrecoverable error.

It's quite clear that most languages with exception-based error handling do not distinguish recoverable and unrecoverable errors; in practice, programmers do find the need from time to time, and will create their own taxonomy. A good example is in a web application, one category of exceptions (maybe sharing a base class) will map to server-side errors, and another category for client-side errors. But because there is no consensus that the community agree on and follow, the lines get blurry quickly.

That's why the introduction of `panic!` to clearly indicate **unrecoverable** errors is so cool! Let's look another example from the same doc, but with a `panic!`

```Rust
use std::fs::File;

fn main() {
    let f = File::open("hello.txt");

    let f = match f {
        Ok(file) => file,
        Err(error) => panic!("Problem opening the file: {:?}", error),
    };
}
```

The author's intention is very clear: there is no point in disguising this error as a value; instead, the application should be terminated pronto; this final and effective; nobody should try to override this decision with a `try catch`; actually, Rust means business with this, [you can't recover from a `panic!`](https://doc.rust-lang.org/book/ch09-03-to-panic-or-not-to-panic.html)

## Go is in between and a step forward

Go as a language has limited facility (by design), in this case there is no union type (yet); but the lack of union type is made up with a simple convention which is held up by the faithful users. Such convention of error handling is in favour of using values; it's a very badass NO to exception-based error handling that is mainstream. I love it.

Still, this is not a pretty convention, it's repetitive, verbose, and annoying, as many would easily contend; does it have to be so? [the Go blog: Errors are values](https://go.dev/blog/errors-are-values) claims people might be missing the point with this prevalent boilerplate, and shows a neat example to prove a point.

However, this quote might be more noteworthy,

> Regardless of whether this explanation fits, it is clear that these Go programmers miss a fundamental point about errors: Errors are values.
> Values can be programmed, and since errors are values, errors can be programmed.

See, the ultimate advantage of modeling errors as values, is that values are first-class, they are easy to create, modify and throw away. They are warm and fuzzy things that we are all comfortable dealing with; Need we still ask "should I use errors for control flow"? Well, there has never been a point more moot. 

Exceptions, on the other hand are not fist-class - they are thrown, not passes around; they are like bombs thrown by the runtime over arbitrary trajectories, and must be caught, or our program blows up.

(Of course I am now compelled to share [The value of values by Rich Hickey](https://www.youtube.com/watch?v=-6BsiVyC1kM). Worth noting it would seem to be unidiomatic to model errors as values in Clojure, it's largely exception-based, as a hangover from JVM).

What about `panic!`? 

Go also distinguishes recoverable and unrecoverable errors; however in the case of `panic!`, it's still recoverable; safe choice, but can be confusing too - I personally tried to simulate `try / catch` with `panic / recover` before the time of proper initiation.

### the boilerplate again

Despite the excellent piece from [the Go blog: Errors are values](https://go.dev/blog/errors-are-values), repeatedly typing `if err != nil` is still part of the daily grind; when this appears twice in a 16-line functions, let's be honest, it could be a mental health issue.

Haskell or F# peeps never had the boilerplate problem, it's a solved problem. In the below example, `findPersonByName` and `findAddressByPerson` both return a `Either` type, and can both return an error. To compose them to make `findAddressByName` goes as follows,

```Haskell
findAddressByName name = do
  person <- findPersonByName name
  address <- findAddressByPerson person

  return address    
```

Pretty neat, isn't it? 

Rust does not have a dedicated `do` notation, but `Result` type could be used fluently, for example chaining with `and_then`. 

```Rust
fn find_address_by_name(name: str) -> Address {
    return find_person_by_name(name)
        .and_then(|person| find_address_by_person(person))
}
```

Although as aesthetically pleasing, function chaining is a popular pattern and is also much more flexible.

Would something similar come into Go? There is [a proposal for more succinct syntax in Go](https://go.googlesource.com/proposal/+/master/design/go2draft-error-handling-overview.md) with `check` that I find very neat.

```Go
func main() {
	handle err {
		log.Fatal(err)
	}

	hex := check ioutil.ReadAll(os.Stdin)
	data := check parseHexdump(string(hex))
	os.Stdout.Write(data)
}
```

### they are the same thing...?

If we are willing to zoom out far enough. Then we see the general idea of error-handling is more or less, "try A, if succeeds, do B; otherwise stop and handle error". Isn't that basically `bind`?