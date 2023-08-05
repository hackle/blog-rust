If you want an electrician, don't hire the entire construction team.

Because the #1 rule of dependency management:

> Depend only on what's needed

Maybe this is too plain, people made a "principle" of it - the famous "Interface Segregation Principle", which says about the same thing: code should not depend on things it doesn't need. 

You would have noticed the intentional paraphrasing, especially with "things", because interfaces are not the only type of dependencies. There are libraries, classes, functions, methods, parameters or input data. You name it.

Any SOLID engineer would claim they are at home with ISP, but like many things in software engineering, this is easier said than done. 

Let's use the broader and clearer rule, albeit its plainness. "Depend Only on What's Needed". It's got a nice acronym too: DOWN!

## Routinely Enterprise

Consider a `ShoppingService` that depends on a `IItemRepository`,

```CSharp
public class ShoppingService
{
    private readonly IItemRepository itemRepo;

    public void Checkout(IEnumerable<int> itemIDs,, ... other params)
    {
        var item = this.itemRepo.FindByIDs(itemIDs);
        ...
    }
}
```

Routine code, right? Let's look at the methods in `IItemRepository`, as you would expect.

```CSharp
public interface IItemRepository
{
    IEnumerable<Item> FindByIDs(IEnumerable<int> itemIDs);
    int Add(Item item);
    void DeleteByID(int itemId);
}
```

Still routine code, but there is a mismatch: `ShoppingService` ever only needs to call `IItemRepository.FindByIDs`, and never `Add` or `DeleteByID`. This is bad dependency management, remember the #1 rule, DOWN,

> Depend only on what's needed

## One of us is lying

Many would ask, "what's the big deal?!" 

For sure, it's CONVENIENT to pass in a big object, just IN CASE any or all of the parts will be useful?

 Needless to say this is a questionable stance, but let's play along. Consider testing. Typically a test is written as,

```CSharp
void TestCheckout()
{
    var itemRepoMock = new Mock<IItemRepository>();
    itemRepoMock.Setup(i => i.FindByIDs(itemIDs)).Returns(Array.Empty<Item>());

    var shoppingService = new ShoppingService(itemRepoMock.Object, ... other mocks);

    var actual = shoppingService.Checkout(...);

    ...
}
```

Nothing out of the ordinary, or is there? 

Here comes the question that we don't (or forget to) ask ourselves, let alone having a good answer for: "how do you know that only `FindByIDs` should be set up, but not `Add` or `DeleteByID`?"

One may say, "duh! because only `FindByIDs` is used in the implementation?!"

That plays right into the trap: "Aha, so the test makes assumptions about the implementation?"

The morale of the dramatised Q & A is a cliche: a test should care little about the implementation of the subject under test. Or as the illuminati put it, "test behaviour, not implementation". Peeking into and depending on the internals of the implementation is a convenient, but slippery slope.

So either the test or the `ShoppingService` is misbehaving: either the `ShoppingService` is greedy, or the test is peeking.

Anyone thinking this "high drama" is *only* about testing is sadly mistaken: tests are simulations of real users. Our finding reveals a very annoying lose-lose situation. 

What's the alternative? We can be foolhardy - mock out every single method on the `IItemRepository`! This is obviously a terrible deal - why waste effort on something that's not really used? 

## Honesty and thrift

One damage that "enterprise" architecture has done, is to abuse interfaces to the extent of complete misuse. To right the wrong, let's see one case how an interface can be REALLY useful: represent capacities as dependency.

The ~~trick~~ idea is to have small interfaces; each interface represent a capacity such as "find items by IDs". When a certain capacity is required by a feature, the interface is required as a dependency.

Therefore our example can be rewritten as follows,

```CSharp
public interface IFindItems
{
    IEnumerable<Item> FindByIDs(IEnumerable<int> itemIDs);
}

public interface IAddItem
{
    int Add(Item item);
}
```

Just like that, we have two separate capacities. Simple enough. Regardless, the consequence is quite pleasant, because the `ShoppingService` can now declare and require exactly what it needs, no more!

```CSharp
public class ShoppingService
{
    private readonly IFindItems itemFinder;

    public void Checkout(IEnumerable<int> itemIDs, ... other params)
    {
        var item = this.itemFinder.FindByIDs(itemIDs);
        ...
    }
}
```

Testing (and mocking for that matter) also becomes less presumptuous - the only method that needs to be set up is `FindByIDs`, because the use of the `IFindItem` interface clearly communicates this dependency. There is no need to peek into the implementation to find out! 

No more lying or peeking, phew!

## 1:1 interface and implementation

An experienced enterprise programmer will raise the question - does this mean I have to implement each small interfaces separately?

This of course is another damage done by the unfortunate prevalence of IoC containers: the wide-spread practice of having 1:1 mapping between interfaces and implementations, otherwise referred to as "header interfaces".

The answer is, no! A class can implement multiple interfaces. In our case, the `ItemRepository` class need a small face-lift,

```CSharp
class ItemRepository : IItemRepository { ... }
```

to,

```CSharp
class ItemRepository : IAddItem, IFindItems, ... { ... }
```

A previously "monolithic" interface is broken down to granular capacity-based interfaces. No need to change its implementation.

## Requiring additional capacities

What if `ShoppingService` changes its requirements, and decides that it also needs to search items by name?

No worries. `ShoppingService` declares the requirement for another capacity. How? With constrained generics.

```CSharp
class ShoppingService<T> where T : ISearchItemsByName, IFindItem
{
    private readonly T itemRepo;

    public void Checkout(...)
    {
        var items = this.itemRepo.FindByIDs(itemIDs);
        // or
        var items = this.itemRepo.SearchByName(name);
    }
}
```

Having to use generics may come as a surprise to C# programmers. The good news is it doesn't have to be so. More powerful type systems such as that of TypeScript offer more fluent syntax as below,

```TypeScript
class ShoppingService(private itemRepo: ISearchItemsByName & IFindItem) { ... }
```

## IoC container

Staunch believers of IoC containers would have been frowning. 

Typically, an IoC container injects implementations per interfaces. When it comes to granular capacity-based interfaces, "automagic" injection may fail to live up to the flexibility. 

True, it's possible to configure a container so that `ItemRepository` is injected for `IFindItem` or `ISearchItemByName`, but what about free combinations such as `ShoppingService<T> where T : ISearchItemsByName, IFindItem`? 

One may argue it's entirely possible through smart, surgical configurations, but inevitably at the cost of increased opacity and fragility, and hiding important information where it matters.

In the wild, people use IoC containers for the convenience of not having to construct objects, and for the magic of being able to grab objects out of thin air. For that purpose, using `IItemRepository` for `ItemRepository` is the fact of life for "enterprise" applications. 

Good for them! But it should be clear by now, any code base with extensive use of IoC containers for dependency injection is probably also in certain and extensive violation of the "Interface Segregation Principle" that many people take for granted. 

SOLID? Maybe not. SOLD? Maybe.

## Challenges, struggles and TypeScript wins it all

If we think of the implementation of capacities as the provider and the user of capacities as the consumer, these two perspectives offer interesting comparisons and each also presents different challenges.

For the provider, implementing multiple interfaces seems straightforward enough, except the constraint in languages such as C# or Java where the interfaces must be implemented explicitly, and must be done when a class is defined, not after. One must resort to boilerplate-heavy design patterns such as wrappers, adapters or proxies to work around such rigidity.

Quite refreshingly, languages like Go, Python and TypeScript allows us to "retrofit" an interface onto an object, by utilising structural typing.

Wouldn't it be nice if interfaces can be implemented after-the-fact? Indeed, it's possible with more modern languages such as [Swift's protocols](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/protocols/#Adding-Protocol-Conformance-with-an-Extension), and most notably [Rust's traits](https://doc.rust-lang.org/book/ch10-02-traits.html), which enables complete decoupling of type definition and implementation of capacities.

For the consumer, we've seen how TypeScript's intersection type `&` makes it intuitive to require multiple capacities, whereas most languages use generic with multiple constraints, each constraint representing an capacity.

These two perspectives are unified when writing tests - how do we provide a test double that satisfies multiple interfaces, protocols or traits? 

This is where many languages, libraries and tools struggle to cope. Yet again structural typing really shines - with TypeScript it's trivial to create an instance of `ISearchItemsByName & IFindItem` on the fly,

```TypeScript
const testItemRepo: ISearchItemsByName & IFindItem = {
    findByIDs: ids => testItems,
    searchByName: name => testItems,
} 

const shoppingService = new ShoppingService(testItemRepo);
```

This is TypeScript's structural typing, type calculation and JavaScript's object syntax at their very best.

## Why interfaces at all?

The rigidity of interfaces is they must be implemented, either nominally or structurally. But why stick to interfaces at all? Why not use functions directly?

```TypeScript
function checkout(
    findItemsByID: (ids: number[]) => Item[],
    ...
) {
    const items = findItemsByID(itemIds);
    ...
}
```

`findItemsByID: (ids: number[]) => Item[]` provides the same capacity as the interface `IFindItem`, who is not much more than a wrapper around a function.

This removes the rigidity around creating "test doubles". Providing a function for `(ids: number[]) => Item[]` is trivial.

```TypeScript
const test_items: Item[] = [{ item1, items2, ... }]
const actual = checkout(itemIds => test_items);
...
```

A simple lambda saves us a bit of mocking and a lot of noise.

See why I said "things" instead of interfaces? One must choose his terms carefully.

Are you DOWN?
