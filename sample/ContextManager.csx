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

var wr2 = new WithResources();
using (wr2) {}
wr2.DoSomething();
// System.Exception: Bad call! Resources have been released!

var wr3 = new WithResources();
wr3.DoSomething();
using (wr3) {}
// output:
// Resources are allocated. Must clean up!
// Did something with resources.
// Resource are disposed!