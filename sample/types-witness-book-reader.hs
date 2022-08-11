{-# Language GADTs #-}
{-# Language DataKinds #-}
{-# Language KindSignatures #-}
{-# Language ExistentialQuantification #-}
{-# Language ScopedTypeVariables #-}


data Lang = English | Chinese

data SpeaksLang ln where
  SpeaksChinese  :: SpeaksLang Chinese
  SpeaksEnglish  :: SpeaksLang English

data Speaker (a :: Lang) = Speaker {
  name :: String,
  lang :: SpeaksLang a
}

-- data BookIn (a ::  = BookIn {
--   name: String,
--   lang: a
-- }

data Person where
  MkPerson :: Speaker a -> Person

hacks = MkPerson (Speaker "hacks" SpeaksEnglish)
wen = MkPerson (Speaker "wen" SpeaksChinese)

-- data Book where
--   Book :: BookIn a -> Book

-- mobyDick = Book (BookIn "mody dick" English)

-- canBuy :: Person -> Book -> String
-- canBuy (Person _ pn) (Book _ bn) = pn ++ " can buy " ++ bn

readMobyDick :: Speaker English -> String
readMobyDick (Speaker name _) = name ++ " at least pretends to be reading Moby Dick"

r1 = readMobyDick (Speaker "hello" SpeaksEnglish)
-- r2 = readMobyDick (Speaker "zao" SpeaksChinese)

tryReadMobyDick (MkPerson psn@(Speaker pn lng)) = 
  case lng of
    SpeaksEnglish -> readMobyDick psn
    _ -> "Moby Dick might be greek to " ++ pn

main = do
  putStrLn $ tryReadMobyDick hacks
  putStrLn $ tryReadMobyDick wen

  
