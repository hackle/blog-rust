use std::path::PathBuf;
use comrak::{ComrakOptions, markdown_to_html};
use regex::Regex;
use rocket::form::validate::Len;
use serde::{Deserialize};

#[derive(Clone, Debug)]
pub struct Blog {
    pub current_post: Post,
    pub content: String,
    pub see_also: Vec<(String, String)>,
}

#[derive(Clone, Debug)]
pub struct Post {
    pub slug: String,
    pub title: String,
    pub path: PathBuf,
    pub hidden: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct Registry<'a> {
    pub title: &'a str,
    pub markdown: &'a str,
    #[serde(default)]
    pub hidden: bool
}

pub fn read_manifest(md_dir: &PathBuf) -> Vec<Post> {
    let manifest = std::fs::read_to_string(md_dir.join("manifest.json")).unwrap();
    let registries: Vec<Registry> = serde_json::from_str(&manifest).unwrap();

    return registries.iter()
        .map(|Registry{ title, markdown, hidden } | Post {
            title: String::from(title.to_owned()),
            slug: to_slug(title),
            path: md_dir.join(markdown),
            hidden: *hidden,
        })
        .rev()
        .collect();
}

pub fn make_blog<F>(slug: &str, all_posts: &Vec<Post>, read_file: F) -> Blog where
    F: FnOnce(&PathBuf) -> std::io::Result<String>
{
    let current_post = find_post_for_slug(&all_posts, slug);
    let markdown = read_file(&current_post.path);

    let content = markdown
        .map(|md| markdown_to_html(&md.to_string(), &ComrakOptions::default()))
        .unwrap_or_else(|err| format!("Path not valid {:?} {:?}", &current_post.path, err.to_string()));

    let see_also = all_posts
        .iter()
        .filter(|Post{ title, hidden, .. }| !*hidden && title != &current_post.title)
        .map(|Post{ title,.. }| (title.to_string(), to_slug(title).to_string()))
        .collect();

    Blog {
        current_post,
        content,
        see_also
    }
}

fn to_slug(raw: &str) -> String {
    let no_whitespace_regex = Regex::new(r"[^a-zA-Z]+").unwrap();
    let no_ws = no_whitespace_regex.replace_all(raw.trim(), r"-").into_owned();

    return no_ws.trim_matches(|c| c == '-').to_ascii_lowercase();
}

fn find_post_for_slug(posts: &Vec<Post>, slug_to_find: &str) -> Post {
    assert!(posts.len() > 0);

    return posts
        .iter()
        .find(|Post { slug,.. } | slug == slug_to_find)
        .unwrap_or_else(|| posts.iter().filter(|Post{hidden, ..}| !*hidden).nth(0).unwrap())
        .to_owned();
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

    #[test]
    fn test_deserialise_registry() {
        let raw = r#"[
{ "title": "A few things about unit testing", "markdown": "presso-pragmatic-unit-testing.md" },
{ "title": "LINQ, infinity, laziness and oh my!", "markdown": "linq-tips.md", "hidden": true }
]"#;
        let expected = vec![
            Registry { title: "A few things about unit testing", markdown: "presso-pragmatic-unit-testing.md", hidden: false },
            Registry { title: "LINQ, infinity, laziness and oh my!", markdown: "linq-tips.md", hidden: true },
        ];
        let posts: Vec<Registry> = serde_json::from_str(&raw).unwrap();

        assert_eq!(posts, expected)
    }
}