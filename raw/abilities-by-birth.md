How does a `Person` gain abilities? By birth?

Of course not, we say, what a terrible idea!

Although, it is very much the case... especially if `Person` is a class.
 
Ok I am not really talking about real people, but `Person` as a type in programming, think class, struct, or any "concrete" types; *abilities* (also called capabilities) are abstractions such as interfaces, traits, protocols or type classes, which can be implemented by / for the types.

So the question becomes: how and when are the abilities decided for a `Person`, or a `Parrot`, as a type?

## Abilities By Birth

Types in most mainstream OO languages like Java, Python or C# are granted abilities by birth. 

For example, in C#, interfaces (as "abilities") must be implemented when `Person` is defined, as below,

```CSharp
interface ICanMove
{
  string Move();
}

interface ICanSpeak
{
  string Speak();
}

class Person : ICanMove, ICanSpeak 
{
  public string Move() { return "Walk"; }
  public string Speak() { return "Mumbo"; }
}

class Parrot : ICanMove
{
  public string Move() { return "Fly"; }
}
```

The `Person` type is modelled with two abilities, the `Parrot`, just one *yet*...

But I should not have said "yet"! Because after its definition, when we realise that a `Parrot` may also be able to "speak", it's not possible to add the new ability `ICanSpeak` to `Parrot` **without** changing the class definition. It's more or less set in stone. Unless we resort to ugly workarounds such as below,

```CSharp
class SuperParrot : Parrot, ICanSpeak
{
  public string Speak() { return "Mimic"; }
}
```

Alas, but inheritance is bad! Or is it? After all, `SuperParrot` **is a** `Parrot`!

Never mind, let me play along and bring in the much more *proper* `ParrotAdapter`.

```CSharp
class ParrotAdapter : ICanMove, ICanSpeak
{
  readonly Parrot _innerParrot;
  public ParrotAdapter(Parrot innerParrot)
  {
    this._innerParrot = innerParrot;
  }

  public string Move() { return _innerParrot.Move(); }
  public string Speak() { return "Mimic"; }
}
```

My eyes! This is way more verbose, and makes for pretty poor semantics. A `ParrotAdapter` has an `innerParrot`?! It's the same holy parrot!

Rant aside, one way to put it - abilities are very much decided **by birth**; it's non-trivial to add extra abilities to a type after-the-fact. The workarounds are either ugly, or verbose AND ugly.

But let me be fair. Compared to Java or Python, C# (or Kotlin for that matter) goes a bit further to support additional abilities with extension methods.

```CSharp
static class ParrotExt
{
  public static string Speak(this Parrot parrot) 
  { 
    return "Mimic"; 
  }
}
```

This can get us pretty far, but still not quite the same as adding extra interfaces... if you do care about interfaces. Or at least care about having it as an option.

## Extra abilities by extension

For quite a long time this problem appeared too hard to retrofit into any widely used language without major breakage, and the workarounds and design patterns ran rampant. Thankfully, more modern languages came along, without the baggage of popularity or legacy, to liberate us from the shackles of *abilities by birth*.

A good example is Rust with traits.

```Rust
trait CanMove {
  fn muve(&self) -> String;
}

trait CanSpeak {
  fn speak(&self) -> String;
}

pub struct Person {}

impl CanMove for Person {
  fn muve(&self) -> String {
    String::from("Walk")
  }
}

impl CanSpeak for Person {
  fn speak(&self) -> String {
    String::from("Mumbo")
  }
}

struct Parrot {}

impl CanMove for Parrot {
  fn muve(&self) -> String {
    String::from("Fly")
  }
}

impl CanSpeak for Parrot {
  fn speak(&self) -> String {
    String::from("Mimic")
  }
}
```

Ah! Not a lot is decided at the time of birth (actually, this example is quite extreme, neither type has any data); instead, `Person` and `Parrot` can both gain more abilities as the need arises.

The same problem is also solved pretty beautifully in [Swift](https://docs.swift.org/swift-book/LanguageGuide/Extensions.html) with protocols, for our example:

```Swift
extension Parrot: CanWalk, CanSpeak {
    // implementation of protocols
}
```

However, the solution in Go may be the most astonishing. Previously we mentioned extension methods, which has become the default style in more modern languages like Kotlin, Rust or Go: the first parameter is `this`, `self`, or the "receiver". Whats sets Go apart, is how it leaps over the idea of implementing an "interface", and uses (compiler-checked) structural typing.

```Go
type Person struct {}
type Parrot struct {}

func (p Person) move() string { return "Walk" }
func (p Person) speak() string { return "Mumbo" }

func (p Parrot) move() string { return "Fly" }
func (p Parrot) speak() string { return "Mimic" }

type CanMove interface {
  move() string
}

type CanSpeak interface {
  speak() string
}

func doSpeak(p CanSpeak) string {
  return p.speak()
}

func doMove(p CanMove) string {
  return p.move()
}

func main() {
  person := Person{}
	fmt.Println("Person", doSpeak(person), doMove(person))

  parrot := Parrot{}
  fmt.Println("Parrot", doSpeak(parrot), doMove(parrot))
}
```

Let's see why this is special. These dots are connected where other languages fall short,

* C# has extension methods, but does not have structural typing
* Python3 with MyPy have structural typing for *Protocol*, but it does not allow extension methods

That's smart of Go. Extra expressive power without forcing the programmer to jump through hoops. Simplicity at its best.

## An open system

To those who think the differences between the two approaches above are only syntactic and superficial, I beg to differ. 

An observation that follows immediately is, the abilities system is now completely **open**. Previously with a **closed** system that requires all abilities to be decided up-front, the concrete implementation (the `Person` class) has to be *opened* every time new abilities are needed. This is not always easy or possible, depending on the ownership of the class; even when we own the type, there can be sub-domains, bounded-context that may require abilities added to the type that are not necessarily relevant to other sub-domains. 

On the other hand, with an **open** system, abilities can be added when needed; this can be done in sub-domains without having to bloat out the core, centralised type. Isn't that what good *domain-driven design* looks like?!

## Data and Behaviour?

A less visible, but perhaps more shocking division, is how this decoupling of types and abilities enables and encourages separation of data and behaviour, in stark contrast to classical OOP teaching of combining them. 

Let's see the impact of this separation with the same example. The implementation of `Person.speak()` is lacking, it really should specify what language.

In the C# example, customarily, we add a new field `Person.Lang`, and change the implementation of `Person.Speak()` accordingly.

```CSharp
enum Lang { English, Chinese }

class Person : ICanMove, ICanSpeak 
{
  Lang Language { get; set; }

  public string Speak() 
  { 
    switch (Language)
    {
      case Lang.English: return "Greetings";
      case Lang.Chinese: return "你好";
      default: throw new NotImplementedException();
    }
  }
  // ...
}
```

This is all nice and good, because there is no other way to go about it: something must be added to the `Person` class to make this happen, despite the possibilities that `Person.Move()` does not care about `Person.Lang` at all. In practice, field `Person.Language` might be saved to and read from a different data table than core `Person` fields such as `Person.Name | Email`.

Of course, soon we also need to add another supporting field `Person.RunSpeed` for `Person.Move()`; and `Person.SwimStyle` when another ability `ICanSwim` is added; yet another for `ICanCook`... you get the idea.

The story is quite different with Rust (or Swift or Haskell for that matter). The core `Person` type should remain unchanged, as it's clear from the original design. To add nuance to its ability `CanSpeak`, extra data should be brought in to support the implementation of `speak()`, but not through a field on `Person`.

```Rust
enum Lang {
  English,
  Chinese,
}

trait PrefersLang {
  fn lang(&self) -> Lang;
}

impl PrefersLang for Person {
  fn lang(&self) -> Lang {
    // ...getting lang for Person
    Lang::English
  }
}

impl <T: PrefersLang> CanSpeak for T {
  fn speak(&self) -> String {
    match self.lang() {
      Lang::English => String::from("Greetings"),
      Lang::Chinese => String::from("你好"),
    }
  }
}

fn main() {
  let psn = Person{};
  println!("{}", psn.speak());
}
```

Let me be clear: if deemed necessary, nothing stops me from adding a `lang` field directly to `Person`; however, in the case to the contrary, I have the option of keeping `lang` away. 

The separation of behaviour forces me to design for cleaner separation of data, therefore to avoid polluting the `Person` type with supporting fields for different abilities.

## Further reading

Worth noting traits in Rust do much more than just enabling adding extra **interfaces**. For one, [ad-hoc polymorphism](/ad-hoc-polymorphism).