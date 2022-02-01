use std::path::PathBuf;
use comrak::{ComrakOptions, markdown_to_html};
use regex::Regex;

pub struct Blog {
    pub Slug: String,
    pub Title: String,
    pub Content: String,
    pub SeeAlso: Vec<(String, String)>,
}

pub fn make_blog(slug: &str, md_dir: &PathBuf) -> Blog {
    let mut blog_posts = vec![
        ("A few things about unit testing", "presso-pragmatic-unit-testing.md")
        , ("LINQ, infinity, laziness and oh my!", "linq-tips.md")
        , ("Lens (really record viewer / updater) in TypeScript", "lens-typescript.md")
        , ("Fin", "fin.md")
        , ("Coding an alternative Vect.index, Type-Driven Development in Idris", "index-fin-alternative.md")
        , ("callCC in Haskell, and my ultimate Monad", "call-cc-my-ultimate-monad.md")
        , ("My take on (unit) testing", "my-take-on-unit-testing.md")
        , ("Serialize like javascript - MergeJSON in Idris!", "serialize-like-javascript-the-prototype.md")
        , ("Serialize like javascript - the idea", "serialize-like-javascript.md")
        , ("foldl in terms of foldr", "foldr-in-foldl.md")
        , ("Inject functions, not interfaces", "no-interface-just-use-functions.md")
        , ("Make unit testing a breeze by segregating complexity", "test-complex-keep-rest-simple.md")
        , ("Don't null check, just continue!", "dont-pattern-match-just-pass-function.md")
        , ("2-layer architecture", "two-layer-architecture.md")
        , ("Types and tests: JavaScript 10, Idris 0", "types-and-tests.md")
        , ("Types, names, and type superstition", "type-superstition.md")
        , ("Out-of-context string template is an anti-pattern", "out-of-context-string-template.md")
        , ("the magic Const, Identity and tuple", "the-const-trickery.md")
        , ("Covariance and contravariance", "contravariant.md")
        , ("T.D.D. is most practical data-driven with pure functions", "tdd-data-driven-and-functional.md")
        , ("Nesting and positions in covariance and contravariance, ", "contravariant-positions.md")
        , ("Reducer to reduce, with lens in OO flavour", "lens-for-reducer.md")
        , ("Dependent types in TypeScript?", "dependent-types-typescript.md")
        , ("The Diamond, squashed and recovered", "the-diamond-kata.md")
        , ("Tuck-away and take-one, whatever it takes to look declarative", "anything-to-be-declarative.md")
        , ("Good code does not matter... not that much", "good-code-does-not-matter.md")
        , ("Setting CAP loose in real life", "cap.md")
        , ("Placement by functionality, not technical concerns", "where-to-place-x.md")
        , ("Plain and simple state management", "plain-state-management.md")
        , ("Self-referenced JSON?", "self-reference-json.md")
        , ("Also on Comonad and Conway's game of life", "conway-comonad.md")
        , ("Dependent Types in TypeScript, Seriously", "dependent-types-typescript-seriously.md")
        , ("Literal type preservation with TypeScript", "type-preservation.md")
        , ("A truly strongly-typed printf in TypeScript", "printf.md")
        , ("On accidental code deletion as reason for unit testing", "what-if-my-code-is-deleted.md")
        , ("The TypeScript Handbook, Optional Parameters and Postel's Law", "the-typescript-handbook-and-postels-law.md")
        , ("Linq is Lazier, not by too much, just within Range", "linq-gets-lazier.md")
        , ("Dependency hell? Not if we use functions! For library authors", "use-functions-keep-it-open.md")
        , ("Your tests may belong elsewhere", "where-have-all-the-tests-gone.md")
    ];
    blog_posts.reverse();

    let secondary_posts = vec![
        ("How is this blog put together", "blog-architecture.md"),
        ("About Hackle's blog", "about.md")
    ];

    let mut all_posts: Vec<(&str, &str)> = vec![&blog_posts[..], &secondary_posts[..]].concat();

    let slugs = to_slugs(all_posts);

    let (title, slug, path) = find_post_for_slug(&slugs, slug, &md_dir);
    let markdown = std::fs::read_to_string(&path);

    let content = markdown
        .map(|md| markdown_to_html(&md.to_string(), &ComrakOptions::default()))
        .unwrap_or_else(|err| format!("Path not valid {:?} {:?}", &path, err.to_string()));

    // let secondary_posts_iter = secondary_posts.into_iter();
    let see_also_slugs = to_slugs(
        blog_posts
            .into_iter()
            .filter(|(t, _)| title != t.to_string())
            .collect()
    );

    let see_also = make_see_also_links(&see_also_slugs);

    Blog {
        Slug: slug,
        Title: title,
        Content: content,
        SeeAlso: see_also
    }
}

fn to_slug(raw: &&str) -> String {
    let no_whitespace_regex = Regex::new(r"[^a-zA-Z]+").unwrap();
    let no_ws = no_whitespace_regex.replace_all(raw.trim(), r"-").into_owned();

    return no_ws.trim_matches(|c| c == '-').to_ascii_lowercase();
}

fn find_post_for_slug(slugs: &Vec<(String, String, PathBuf)>, slug: &str, current_dir: &PathBuf) -> (String, String, PathBuf) {
    let _default = &slugs[0];
    let mut iter = slugs.into_iter();

    let found = iter.find(|(_, s, _)| s == slug);
    let (title, slug, path) = found.unwrap_or(_default);

    return (String::from(title.to_owned()), slug.to_owned(), current_dir.join(path.to_owned()));
}

fn to_slugs(posts: Vec<(&str, &str)>) -> Vec<(String, String, PathBuf)> {
    return posts
        .iter()
        .map(|(t, p)| (String::from(t.to_owned()), to_slug(t), PathBuf::from(p)))
        .collect();
}

fn make_see_also_links(all_posts: &Vec<(String, String, PathBuf)>) -> Vec<(String, String)> {
    let links: Vec<(String, String)> =
        all_posts.into_iter()
            .map(|(t, s, _)| (t.to_owned(), s.to_owned()))
            .collect();

    return links;
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_to_slugs() {
        assert_eq!(to_slug(&"slug-slug"), String::from("slug-slug"));
        assert_eq!(to_slug(&" A B C D"), String::from("a-b-c-d"));
        assert_eq!(to_slug(&" A  D"), String::from("a-d"));
        assert_eq!(to_slug(&"Great_is not bad"), String::from("great-is-not-bad"));
        assert_eq!(to_slug(&"but, we shall see!"), String::from("but-we-shall-see"));
    }

    #[test]
    fn test_find_post_by_slug() {
        let mut posts = vec![
            ("Anything to be declarative", "anything-to-be-declarative.md"),
            ("Types and tests", "types-and-tests.md")
        ];
        // assert_eq!(find_post_for_slug("non-existent", &PathBuf::from("src/")), PathBuf::from("src/anything-to-be-declarative.md"));
        // assert_eq!(find_post_for_slug(&mut posts, "anything-to-be-declarative", &PathBuf::from("src/")), (String::from("Anything to be declarative"), PathBuf::from("src/anything-to-be-declarative.md")));
        // assert_eq!(find_post_for_slug(&mut posts, "types-and-tests", &PathBuf::from("src/")), (String::from("Types and tests"), PathBuf::from("src/types-and-tests.md")));
    }
}