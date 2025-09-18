{-# LANGUAGE GADTs #-}
module GADT where

data TermInt = LitT Int | AddT TermInt TermInt

evalT :: TermInt -> Int
evalT (LitT n) = n
evalT (AddT t1 t2) = evalT t1 + evalT t2

data Term a where
    Lit  :: Int -> Term Int
    Add  :: Term Int -> Term Int -> Term Int
    Eql   :: Term Int -> Term Int -> Term Bool
    
deriving instance (Eq a) => Eq (Term a)
deriving instance (Show a) => Show (Term a)

eval :: Term a -> a
eval (Lit n) = n
eval (Add t1 t2) = eval t1 + eval t2
eval (Eql t1 t2) = eval t1 == eval t2

t1 = Add (Lit 1) (Add (Lit 2) (Lit 2))
t2 = Add (Lit 2) (Lit 4)

eq = eval (Eql t1 t2)

main :: IO ()
main = do
    print $ show $ evalT (AddT (LitT 2) (AddT (LitT 2) (LitT 3)))
    print $ show t1 ++ "is equal to " ++ show t2 ++ "? " ++ show eq