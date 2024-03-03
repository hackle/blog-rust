We programmers are big on virtues, and loose coupling (or decoupling) is a massive virtue in our book. Use of interfaces is virtuous as it decouples consumers and provider; microservices are virtuous, because they decouple dependencies; event-driven architecture and message queues are virtuous, because they decouple publishers and subscribers. 

How naive!!!

Because we are also big on pendulum swings, and what is easier or more important than _CONSISTENCY_? So, no two things should be stuck together, `new()` is evil and should be banished, everything must be message-fied, even passing data between 2 functions within the same process.

What will take time to realise is, "high cohesion" is another virtue that is best considered simultaneously with loose coupling, or else everything turns into a sea of mud pretty quickly. 

And there is nothing worse than two _decoupled_ things that are _actually coupled_, but remotely, invisibly, buried away in indeterminate amount of code, ambushing the innocent virtuous programmers.

## Routing

We have a beautiful router with rich feature set: it allows us to name a segment in the URL!

```CSharp
app.route("/user/(:name)", UserProfileController);

public class UserProfileController
{
    public UserProfile Get(string name)
    {
        // ...
    }
}
```

Magically, `name` from the route path will be extracted and passed to `UserProfileController.Get(name)` as parameter `name`. Perfect! 

Now, another well-intentioned programmer may decide that `name` should be called `userName` in `Get(string userName)`, and we must agree this is a good, and harmless change: what could possibly go wrong by renaming a parameter? Well, nothing but the router! Errors will crop up in production for this innocent rename, because...

The `Get` method is accidentally coupled to the pattern in the route path.

How do we fix this? A mitigation is to bring the path and the method together,  

```CSharp
@route("/user/(:name)")
public UserProfile Get(string name)
{
    // ...
}
```

But this is merely a mitigation, and requires the programmer, who is well known for letting comments go out of sync, to pay close attention to a cryptic pattern in a string.

The state of art is empowered by TypeScript, 

```TypeScript
app.route('/user/(:name)', (params: { name: string }) => { ... });
```

TypeScript's powerful type system allows us to parse the path, a string literal into a type `{ name: string }`, so they are never allowed to go out of sync, or rejection from the type checker.

## Life Cycle Methods

We construct a object, and find just the method we want to call,

```CSharp
var userProfile = new UserProfileController().Get("Hackle");

// ... do things with userProfile
```

The compiler is happy, the IDE does not give us colourful wriggly wavy lines, what could possibly go wrong? We run the code for a test, or YOLO(TM) deploy it. Errors crop up in production, this time is a very friendly one, even with helpful instructions! `UserProfileController has not been initialised; have you forgot to call UserProfileController.initialise()?`.

Face-palm! How could we forget to call `initialise()`?! Or how could we not? Little did we expect, `UserProfileController.Get` is accidentally coupled to `UserProfileController.initialise`.

The antidote: "construct once, complete for ever".

## Exception try and catch

We upgrade a library; it's necessary, feature wise, security wise, virtue wise. No version conflicts even with transitive dependencies considered; compiler is happy, all tests are green; deployment is made, we clapped our hands, a job is done. But errors crop up in production, 'tis a new exception that has never been seen before!

We have a quick look around, dig through recent changes, finally find this line in the release notes of the library: "to improve user experience, when a `UserProfile` is not found, a `NotFoundException` is thrown instead of `BadArgumentException`". That's it! This is our vigilant code,

```CSharp
try {
    var userProfile = new UserProfileController().Get("Hackle");
} catch (BadArgumentException ex) {
    // gracefully handle BadArgumentException
}
```

But why, why can't we pay closer attention to release notes?! Indeed, but should we?

Little did we know, any `catch` is accidentally coupled to and at the mercy of the code that `throw`s.

The antidote: use Go, Rust, Elm. Programmers who say they don't use `try / catch` for control-flow are liars.

## Events

We have microservices, they are truly decoupled: they don't even call each other! All they do is receiving and sending events to a ~~shared~~(dirty word) central queue. HTTP is outdated, so is synchronous communication, not to mention orchestration (dirty word again). Choreography is the shizzle. Flexibility, adaptability, reliability, you name it. Events are even persisted, they make the new database. A brave new world.

A few months deep, we found something strange: for event type `GetUserProfile`, the service does not ALWAYS receive a corresponding event of type `GetUserProfileResult`, but only 98% of the time. How strange! We have not seen any spikes of HTTP 500/400 errors? Ah, of course not, HTTP is out-dated...

But why, why did the `user-profile-service` fail its contract? Anything less than 99.9999999999% is unacceptable. Are they replaying events in the dead-letter queue? An inquiry must be made!

Little did we know, our service is accidentally coupled to `user-profile-service` by events. We still get errors, just not right away!

## Validation

User input is represented in a model (let's say a class, not a lazy representation such as JSON object or string-to-string map); the model is validated as it enters the application; invalid models are rejected, and only valid models are allowed to proceed to the next layers of the processing pipeline, conventionally, the domain of the application, the service layer.

A service receives and processes the model based on the assumptions that it has been validated by the previous layer, so it needs not bother with repeated validation. After all, validation is the responsibility of the presentation layer. Separation of concern!

Now we add another user interface to the application. Be it web, API, CLI or GUI (why not). The new interface calls through to the service layer, faithfully providing any models as required and specified via "strong" types. The compiler is happy, deployment is made, but no! Invalid data creeps into the application, because the new user interface lacks validation!

Why can't the new UI take its part in validation? It's common sense for any engineers to be defensive and trust no user input! Complete failure of the UI! But wait, why can't the service layer be defensive with the model? Oh but it's a representational concern not a core domain concern. Either way, by separating concerns across layers, but making assumptions that one layer MUST handle validation before passing data to the next layer, they are accidentally coupled!

## Not all couplings are equal: locks, keys and phone cases

Coupling is identified when two things must change together, such as a pair of lock and key. Changing the lock without also changing the key, or changing the key without also changing the lock, can lead to people getting locked out. This can be a stressful situation for the rightful users, but may also be used for the benefit of security: a house owner may change a lock to intentionally lock out unwelcomed visitors. This tells us "coupling" is not always a bad thing, contrary to popular belief in software engineering, which seems to have a worship for "decoupling". But why so?

In software engineering terms, one may interprete the key-lock relationship creatively (in fact, ambiguously). Sure, the key is coupled to the lock and vice versa, but only to the extent of the expected shapes (springs, tumblers and what not); but one is free to make ("implement") the key in whatever material they choose: metal, bronze, or gold; one may also make a cute flower-shaped bow (where we hold to turn the key). The options are limitless. Look, this is "loose" coupling! 

That indeed, is a form of "loose" coupling, but the question to ask is: how useful is such "loose" coupling? For the analogy of keys, not very much. Most people may get copies made for a key once in a blue moon, but I doubt anyone gets super creative with the copies, so it might be more helpful to treat the key(s) and the lock always together, not separately. 

However, for mobiles phones and phone cases, oh, loose coupling is very useful! The vast majority of phone cases are made separately from the phones, and many people are very picky with the choice of phone cases. So, it's essential to be able to alter the material, shapes and features of a phone cases separately; the requirement to fit the shape of the phone is important, but may not be the deciding factor for a purchase. 

Not all loose couplings are born equal.

## Contract and Implementation: Changes, cost and benefit

Supposed two things never had to interact with each other, not even indirectly, they are in every sense "decoupled"; but if that's the fact, then there should be no need to bring them to the same discussion! Obviously, this is not the type of "coupling" we are discussing.

In programming, coupling is discussed when two things need to work together, like the lock and the key. Usually, it's desirable to separate the making of these two things, for reasons such as modularisation, separation of concerns and what not. The act of separation gives rise to the "contract", which **binds** two separate things together, so the implementations may be separate ("loosely" coupled or "decoupled"), but the contract must not be broken. But what if the contract needs to change?

This is the challenge number one: how can we manage contract changes? The quality of coordination is the deciding factor in evaluating the quality of the "loose coupling".

- If both parties of the contract interact on a code level, then the coordination may be enforced by the programming language, the compiler or the type checker. Such enforcement is usually the strongest: failure to abide by the contract results directly in compilation errors; usually, artefacts cannot be built, and deployments are not possible.
- The presence of one of the parties may be in the form of a library. This form optimises for distribution, and still utilises the facilities of the programming language. Occasional, there is the problem of version mismatch, if the same library is also used by other libraries, and not all of them agree on the versions to use.
- If the parties live more separately, such as different code bases, written in different programming languages, and are executed in different processes / runtimes, then enforcement of the contract is much, much harder. Failures may only appear as dreaded **breaking changes** on runtime instead of compile time, which may be harmful. There are techniques such as API versioning, contract / end-to-end testing, but such techniques usually incur significantly higher cost than type-checking.

In a word, the distance between the parties plays a big part in the quality of enforcement of the contract, as well as the cost of keeping up such vigilance, if ever. In practice, not every team or engineer is able to do so, and defers to production errors for discovery of contract "drifts" or breaking changes. Unfortunate!

Note "contracts" may appear in different forms on different levels, for example types, interfaces, documentation, schemas etc. Obviously some are stronger than the others.

## Loosely, yet tightly coupled

A weak contract is not much better than none. In the routing example, the *contract* between the router and the controllers is the path `"/user/(:name)"`; the router is bound to enforce and provide the `name` parameter, and the `controller` is bound to accept the `name` parameter. However, this "stringly-typed" contract cannot be expressed with types and enforced by the compilers of most mainstream languages.

A good mitigation is to bring the parties involved as close together as possible; a proper solution requires powerful typing mechanism, such as with TypeScript.

A weak contract is not nearly as harmful as a partial contract. Exception try catch is the epitome of this type of contracts: the consumer and the provider are supposed to be loosely coupled, but the consumer expects the provider to throw a specific type of exception. However, if this expectation is not expressed with types, as it's the case with many languages, then it's as if the parties involved have a backchannel of communication. This backchannel doesn't just undermine the value of the contract, but also ties them together: tight coupling!

Similar interpretation applies to life-cycle methods. The type of `new UserProfileController().Get("Hackle")` is a binding promise that when a name is provided, `Controller` will attempts to find a `UserProfile`. The requirement to call `Initialise()` first is hidden from the contract, and therefore undermines the trust of any user.

The hidden requirement problem has a solution: parameterise! Any hidden requirement can be lifted to explicit parameters, therefore to help express any pre-conditions in full (compared to partially). Exceptions are better expressed as union types; the requirement to call `Initialise()` can be modelled by adding a new type for the fully initialised `Controller` (maybe in the form of another class, a `Service` if you may).
