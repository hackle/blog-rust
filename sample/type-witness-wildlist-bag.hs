{-# Language GADTs #-}

data Witness a where
  WitnessInt :: Witness Int
  WitnessStr :: Witness String

data WildList a = WildList {
  sample  :: Witness a
  , daata :: [a]
}

data Bag where
  Bag :: WildList a -> Bag

bagOfInts = Bag $ WildList WitnessInt [1,2,3]
bagOfStrs = Bag $ WildList WitnessStr ["a", "b", "c"]

sumStrs :: [String] -> String
sumStrs = unwords

sumInts :: [Int]  -> String
sumInts = show . sum

unwrap :: Bag -> String
unwrap (Bag bag) =
  case sample bag of
  WitnessInt -> sumInts $ daata bag
  WitnessStr -> sumStrs $ daata bag

main = do
  putStrLn $ unwrap bagOfInts
  putStrLn $ unwrap bagOfStrs