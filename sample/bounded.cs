#nullable enable

using System.Collections.Immutable;
using Bounded2To5 = Bounded<Two, Five>;

// ok
var bounded1 = Bounded2To5.TryMake(2);
// fails to construct - returns null
var bounded2 = Bounded2To5.TryMake(6);

var two = new Two();

Console.WriteLine($"bounded 1 {bounded1}");
Console.WriteLine($"bounded 2 {bounded2}");
Console.WriteLine($"two {two}");

// ok
var listOf2 = FixedSizeList<Two, string>.Create(["foo", "bar"]);

// construction failed - returns null
var listOf2Bad = FixedSizeList<Two, string>.Create(["foo"]);

Console.WriteLine(listOf2);
Console.WriteLine(listOf2Bad);

public interface ISingletonInt
{
    abstract static int Value { get; }
}

record struct Two : ISingletonInt
{
    public static int Value => 2;
}

record struct Five : ISingletonInt
{
    public static int Value => 5;
}

public record struct FixedSizeList<TSize, T> where TSize : ISingletonInt
{
    // 1: hide the public constructor and force construction through Create
    public ImmutableList<T> Value { get; init; }
    FixedSizeList(ImmutableList<T> checkedValue) => Value = checkedValue;

    // 2: use the value of the TSize singleton
    public static FixedSizeList<TSize, T>? Create(
        ImmutableList<T> uncheckedValue
    ) =>
        uncheckedValue.Count == TSize.Value ?
        new(uncheckedValue) :
        default;
}

public record struct Bounded<TLower, TUpper>
    where TLower : ISingletonInt
    where TUpper : ISingletonInt
{
    public int Value { get; init; }
    Bounded(int checkedValue) => Value = checkedValue;

    public static Bounded<TUpper, TLower>? TryMake(int uncheckedValue) =>
            (uncheckedValue >= TLower.Value && uncheckedValue <= TUpper.Value) ?
            new(uncheckedValue) :
            default;
}