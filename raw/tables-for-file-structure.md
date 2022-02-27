3-layer architecture. 4-layer architecture. Onion architecture. Domain-driven architecture. Ports and adapters. Hexagonal architecture. etc. etc.

Software engineering is so diversified, excitedly they say, look at the styles of architecture for us to choose from!

Yes, they are indeed many, maybe like flavours of cucumbers, and not nearly as tasteful. Also, maybe they are not that different - they are just different schema designs, you know, like in relational databases, or really, like spreadsheets.

# the expression problem

One of the best explanation for me about the "expression problem" is [this](https://stackoverflow.com/a/22180495/4687081) by [Calmarius](https://stackoverflow.com/users/58805/calmarius) using tables, you know, plain columns and rows. The gist is, it's easy to add data (rows), but not so changing schema (columns). Designing types is like designing schemas, they are essential activities, as we have learned in the world of relational databases.

If types can be treated as data, then certainly code should be too? After all it's been a trendy thing to say, "code is data"!

So here we are again, looking at the perennial discussion of file structure in a code base. Given the following files, how should we organise them?

* PaymentController
* PaymentModel
* IPaymentService
* PaymentService
* IPaymentRepository
* PaymentRepository
* MemberController
* IMemberService
* MemberModel
* MemberService
* IMemberRepository
* MemberRepository

Never mind the naming convention, it's not what would have but hopefully they are indicative enough. and never mind the ordering for now although it does reveals biases.

First we observe each file has two aspects: the technical aspect - controller, model, service, repository, interface, implementation; and the domain aspect - payment, member(ship). Let's try to put them in a table.

But hold on - now we have a design a schema - which should the columns be? Let's pick the "features" first.

# A. domain aspects as columns

Here, each row is a folder. Note there is rigidity to table schemas, as intended; the point is to restrict and guide placement of files. So, by making two columns "Payment" and "Member", this "architecture" prescribes all the rows must serve these two purposes ("features"), as they make up the entire domain. 

| Folder               	| Payment            	| Member            	|
|----------------------	|--------------------	|-------------------	|
| Controller           	| PaymentController  	| MemberController  	|
| Service Interface    	| IPaymentService    	| IMemberService    	|
| Service              	| PaymentService     	| MemberService     	|
| Repository Interface 	| IPaymentRepository 	| IMemberRepository 	|
| Repository           	| PaymentRepository  	| MemberRepository  	|
| Model                	| PaymentModel       	| MemberModel       	|


You may be surprised, but this could be by far the most popular way to organise source code. Don't believe me? Check if your solution has any of these folders,

* controllers
* services
* repositories
* models
* interfaces

If any of these folders exists, then it's a "yes", more of less. Of course it may not always be verbatim. In fact, we just call it "n-layer architecture", or analogies like "service oriented", or "onion architecture".

There is a big advantage this to this structure:  If we run a query: `SELECT * FROM files WHERE Item = 'Interface'`, we get all the Interfaces - imagine this can be quite handy for binding interfaces to implementations for a dependency injector.

Its disadvantages should have been made clear with this table: it's quite hard to add a new feature, say "Search"; we must backfill every single row with the respective `SearchController`, `ISearchService`, `SearchService`, etc. 

Or, to find everything about "Payment", the query is `SELECT Payment FROM files`, this is a table scan; OK we should possibly create a "Payment_Index" so it's an index scan. But if we add the "Search" feature, a new index must be created.

If we put the cost of change in big O notations, all folder must change with any feature change; in complexity, this "architecture" style features that of `O(n)`.

One may argue it's `O(1)` to add a new technical aspect, for example, a new `*ModelValidator` for each feature. This may be true, but how often does that happen in a solution in production?

# B. technical concerns as columns

What if we transpose the table, so the technical aspects are columns?

| Folder  	| Controller        	| Service Interface 	| Service        	| IRepository        	| Repository        	| Model        	|
|---------	|-------------------	|-------------------	|----------------	|--------------------	|-------------------	|--------------	|
| Payment 	| PaymentController 	| IPaymentService   	| PaymentService 	| IPaymentRepository 	| PaymentRepository 	| PaymentModel 	|
| Member  	| MemberController  	| IMemberService    	| MemberService  	| IMemberRepository  	| MemberRepository  	| MemberModel  	|

Now run `SELECT * FROM files WHERE item='Payment'`, and we should get everything related to the story of "Payment".

If we want to add the "Search" feature, it's a matter of inserting another row. `UPDATE` or `DELETE` any feature should be equally straight-forward.

However, it's not so easy to get all the `Controller`s. Again, we can create a `Controller_Index`. This should be an acceptable cost; as we possibly won't be creating an index for every column.

In terms of complexity, adding or changing a feature is `O(1)`, doesn't get any better.

In colloquial terms, this is what a "domain driven architecture" looks like.

## Schema-less

But what if a new technical concern, like `*ModelValidator` is required? This do again require a change across the table (pun intended), but it should be expected.

A hidden factor here is, this schema leads to very lean and self-sufficient folders; as they are so autonomous and independent of each other, a form of freedom should grow; given time, programmers will find the constraints of the columns unnecessary, so they will be removed, so we arrive at a schema-less, or "NoSQL" style - each folder contains whatever necessary to make up a feature; they don't really share the same internal structure. While this sounds very liberating, it may not be what everybody wants, for reasons known or unknown.

# A combination 

While I am one to be biased towards the latter (or schema-less) style, many from the industry had realised option A is pretty silly, so there have been methods of mitigation, for example, let's not have "Service Interface" and "Repository Interface"; they should be put in the same folder (or package) which is called "interfaces". Or, interfaces should live together with models, optionally services, and let's call them "core" or "domain".

If this sounded like a good idea, it's not, if we look at the columns and rows in the table.

| Folder                          	| Payment            	| Member            	|
|---------------------------------	|--------------------	|-------------------	|
| Controller                      	| PaymentController  	| MemberController  	|
| Domain                          	|                    	|                   	|
| - Domain/Models                 	| PaymentModel       	| MemberModel       	|
| - Domain/Interface/Service      	| IPaymentService    	| IMemberService    	|
| - Domain/Interface/Repository   	| IPaymentRepository 	| IMemberRepository 	|
| - Domain/Implementation/Service 	| PaymentService     	| MemberService     	|
| Repository                      	| PaymentRepository  	| MemberRepository  	|

Combining "layered" and "domain-driven" architecture gives rise to a confusing and awkward file structure: for some code (`Controller` or `Repository`), there are dedicated folders; for other code, I have to drill down a rabbit hole of folders organised around technical concerns.

But SQL best practices says it the best - this schema design breaks normalisation, and creates a hidden, nested sub-schema. Of course this is a bad idea - what if I want to further specialise `PaymentRepository`, for example, to have two strategies: one over Http and another over Postgres?

| Folder                                 	| Payment               	| Member              	|
|----------------------------------------	|-----------------------	|---------------------	|
| Repository                             	|                       	|                     	|
| - Repository/Postgres                  	| PaymentPgRepository   	| MemberPgRepository  	|
| - Repository/Http                      	| PaymentHttpRepository 	|                     	|

That's normalisation broken into pieces.

# Question

At this point of time, let me raise this question: is application architecture the same problem as the expression problem?