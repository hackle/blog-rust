The blog posts from haskellforall on church encoding then final encoding were true eye-openers.

I realised that I had tried this technique unknowingly for some dependency injector magic, which would have been magical therefore disgusting but a key point from that exercise is that in an imperative language, as a dirty trick, all types can be unified with `void`.

Let me explain. Here is a typical example of church encoding.


However, it's pretty well know that `void` is not really a type that can be used as other types for generics, to the frustration of many. For example `List<int>` is fine but `List<void>` is not cool. Progrrammers were found giving a nonsense type anyways when that's needed such as `List<bool>` when `List<void>` is needed. This is a pretty annoying problem as APIs have to account for both `void` and non-`void`.