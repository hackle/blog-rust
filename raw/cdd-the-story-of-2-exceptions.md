Some people say developers would go to incredible lengths to avoid passing an argument. This slightly altered version is no less true: language designers would go to incredible lengths to "help" us avoid returning an error.

As usual this is done "for your own good", but let me tell you a story of two exceptions.

## from null to HttpError(404)

In the age of microservices, I shall not be blamed to create a web service ("Service Foo") that calls another web service ("Service Bar"). To call service B, we use a smart open-source `HttpClient`. One of the Controllers looks like,

```csharp
class FooController
{
    public Bar GetBar(int barId)
    {
        return this.HttpClient.Get(self.ServiceBarUrl, $"/bar/{barId}");
    }
}
```

We also want to return meaningful responses when a `Bar` cannot be found, in which case the `HttpClient` returns  `null` (it's smart, remember). A trivial change,


```csharp
class FooController
{
    [Route("foo_bar/{barId}")]
    public Bar GetBar(int barId)
    {
        var bar = this.HttpClient.Get(self.ServiceBarUrl, $"/bar/{barId}");
        if (bar == null)
        {
            throw new HttpError(status=404);
        }

        return bar;
    }
}
```

We check in this beautiful code, drink a coke to the congratulations of the product manager and teammates, while the change hits production (courtesy of chunk-based development and truly continuous deployment pipelines).

However, before the coke is fully enjoyed, our popular "Service Foo" is driving a vertical spike of thousands of 500 errors, upon a closer look, with cold shivers, we find it's none other than `/foo_bar/{barId}`!!!

## HttpError vs HttpError

You'll agree this doesn't make any sense! Indeed, upon minute inspection of every line of code, there is no fault to be found. But StackTrace (TM) don't lie, and it coldly points to `throw new HttpError(status=404)`, which is exactly what the web framework requires to return a `404`.

OK, I've toyed with the fictitious hero long enough. It turns out while the web framework accepts `HttpError(status=404)` and translates it to `404 Not Found`, it only accepts its own definition of `HttpError`; little did we know, the smart open-source `HttpClient` comes with its own `HttpError` that can be used exactly the same (for reasons suspicious but unknown), and our hero (to be fair, the IDE did most of this) has accidentally imported the `HttpError` from `HttpClient`!!! (spiderman vs spiderman meme comes here)

With that knowledge we remove the import of `HttpError` and use the `HttpError` from the web framework, a quick deploy follows with considerably less fan fair. We calmly close the laptop, and head to the office kitchen for a cup of tea. Problem solved!

Or is it?

## A dead-end

At what is expected to be a brief (if not unnecessary) post-mortem, we are asked this seemingly dumb question (possibly from our colleagues usually referred to as "non-technical"): how could we prevent this from happening again?

After a much-warranted dry smirk and one or two quick-fire answers, we find there is actually no easy answer to this question! The only viable option may be to write an end-to-end test to assert that the expected status is returned. These other options won't work,

* to prohibit using `HttpClient.HttpError` - we still want to be able to check against errors returned from `HttpClient`, for example, turning a `5xx` to a `4xx` when fitting.
* to alias `HttpClient.HttpError as HttpClientHttpError`, this can not really be enforced
* to raise a PR for the open-source project to rename `HttpClient.HttpError` to `ExoticHttpError`, which is destined to be rejected by any sane maintainer as this is a BREAKING CHANGE!

And we'd ask ourselves: it's the year of 2023, and the only way to prevent this error is to write an end-to-end test?

## Exceptions == dynamic typing

Yes you read this right - your favourite language may be advertised as "strongly-typed", but when it comes to exceptions, it's dynamic!

Any method, no matter what types its parameters and return value, can throw ANY type of exception. (Yes, I am aware of checked exceptions but I also know no small percentage of developers just catch and turn them into unchecked exceptions anyway).

Control flow wise, exceptions are much like the notorious GOTO statement; typing wise, it's quite the wildcard type!

## Errors as values

But what's the alternative? None else than returning errors as values!

If you favourite language has no support for returning errors as values, or although the support is there, but the community objects, start looking elsewhere!

Because value-based error handling is how we get determinism. The simplest facility and convention is from Golang,

```go
func getBar() (interface{}, HttpError) {
    bar, err := httpClient.getBar(request.barId)

    if err != nil {
        return nil, err
    }

    // not found
    if bar == nil {
        return nil, HttpError{Status:404}
    }

    return bar, nil
}
```

Here `(interface{}, HttpError)` is required by the web framework, there is no way to give the incorrect `HttpError` from `HttpClient`, because the compiler will reject it for mismatched return type.

People may laugh at this seemingly clumsy pattern: what fools would tolerate bubbling errors up layer after layer? Aren't we supposed to follow DRY?

Maybe, maybe, if only other more valuable qualities are met first, such as correctness and determinism. Otherwise, DRY, or "clean", or "pragmatic" doesn't mean much. 

You see, the problem here is we are tempted to pursue more superficial aesthetics, which is **convenient**; we leave behind **principles** that may not be as pleasing, but when followed, are sure to bring benefits that more sound and last longer.

But I am selling **the way of principle** short. More modern languages make it just as beautiful, look at [this example from the Rust doc](https://doc.rust-lang.org/book/ch09-02-recoverable-errors-with-result.html)

```rust
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
```

This is not just neat by looks, it also gives us the peace of mind that no surprises are in store. Such is the power of sticking to values, or sticking to principles.

You see, disciplines are converging with aesthetics quickly, and maybe also convenience without the downsides? 

That is, if only we are lucky or powerful enough to have the choice of action. If not? At least we have the choice of thoughts.

## Further reading

* A previous post on [Golang error handling: yes to values, no to exceptions, a win for the future](/go-lang-error-handling)
* Another post on [the geometric beauty of programming
](/geometric-beauty-of-code-design)