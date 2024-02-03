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

## Not all couplings are equal: locks, keys and phone cases

Coupling is identified when two things must change together, such as a pair of lock and key. Changing the lock without also changing the key, or changing the key without also changing the lock, can lead to people getting locked out. This can be a stressful situation for the rightful users, but may also be used for the benefit of security: a house owner may change a lock to intentionally lock out unwelcomed visitors. This tells us "coupling" is not always a bad thing, contrary to popular belief in software engineering, which seems to have a worship for "decoupling". But why so?

In software engineering terms, one may interprete the key-lock relationship creatively (in fact, ambiguously). Sure, the key is coupled to the lock and vice versa, but only to the extent of the expected shapes (springs, tumblers and what not); but one is free to make ("implement") the key in whatever material they choose: metal, bronze, or gold; one may also make a cute flower-shaped bow (where we hold to turn the key). The options are limitless. Look, this is "loose" coupling! 

That indeed, is a form of "loose" coupling, but the question to ask is: how useful is such "loose" coupling? For the analogy of keys, not very much. Most people may get copies made for a key once in a blue moon, but I doubt anyone gets super creative with the copies, so it might be more helpful to treat the key(s) and the lock always together, not separately. 

However, for mobiles phones and phone cases, oh, loose coupling is very useful! The vast majority of phone cases are made separately from the phones, and many people are very picky with the choice of phone cases. So, it's essential to be able to alter the material, shapes and features of a phone cases separately; the requirement to fit the shape of the phone is important, but may not be the deciding factor for a purchase. 

Not all loose couplings are born equal.
