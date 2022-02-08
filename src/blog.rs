use std::env;
use std::future::Future;
use std::path::PathBuf;
use comrak::{ComrakOptions, markdown_to_html};
use regex::Regex;
use serde::{Deserialize};
use crate::blog;

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
    pub path: String,
    pub hidden: bool,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct Registry {
    pub title: String,
    pub markdown: String,
    #[serde(default)]
    pub hidden: bool
}

pub struct GithubSource {
    pub base_url: String
}

pub struct LocalSource {
    pub directory: PathBuf
}

impl LocalSource {
    pub fn get_manifest(&self) -> Result<Vec<Registry>, String> {
        let manifest = std::fs::read_to_string(&self.directory.join("manifest.json")).unwrap();
        let manifest: Vec<Registry> = serde_json::from_str(&manifest).unwrap();
        Ok(manifest)
    }

    pub fn read_content(&self, p: &String) -> Result<String, String> {
        std::fs::read_to_string(&self.directory.join(p))
            .map_err(|_| String::from("Cannot read markdown"))
    }
}

impl GithubSource {
    pub async fn get_manifest(&self) -> Result<Vec<Registry>, String> {
        let url = format!("{}/{}", self.base_url, "manifest.json");
        return match reqwest::get(&url).await {
            Err(_) => Err(String::from("Cannot read remote manifest")),
            Ok(response) => response.json::<Vec<Registry>>().await.map_err(|err| String::from(format!("Cannot deserialize response, {:?}, {:?}", &url, err)))
        };
    }

    pub async fn read_content(&self, markdown: &String) -> Result<String, String> {
        return match reqwest::get(format!("{}/{}", &self.base_url, &markdown)).await {
            Err(_) => Err(String::from("Cannot read remote markdown file")),
            Ok(response) => response.text().await.map_err(|_| String::from("Cannot read remote markdown content"))
        }
    }
}

pub fn to_posts(registries: &Vec<Registry>) -> Vec<Post> {
    return registries.iter()
        .map(|Registry{ title, markdown, hidden } | Post {
            title: title.to_owned(),
            slug: to_slug(title),
            path: markdown.to_owned(),
            hidden: *hidden,
        })
        .rev()
        .collect();
}

pub fn make_blog(current_post: &Post, all_posts: &Vec<Post>, markdown: &String) -> Blog {
    let content =  markdown_to_html(&markdown.to_string(), &ComrakOptions::default());
        // .unwrap_or_else(|err| format!("Path not valid {:?} {:?}", &current_post.path, err.to_string()));

    let see_also = all_posts
        .iter()
        .filter(|Post{ title, hidden, .. }| !*hidden && title != &current_post.title)
        .map(|Post{ title,.. }| (title.to_string(), to_slug(title).to_string()))
        .collect();

    Blog {
        current_post: current_post.to_owned(),
        content,
        see_also
    }
}

fn to_slug(raw: &str) -> String {
    let no_whitespace_regex = Regex::new(r"[^a-zA-Z]+").unwrap();
    let no_ws = no_whitespace_regex.replace_all(raw.trim(), r"-").into_owned();

    return no_ws.trim_matches(|c| c == '-').to_ascii_lowercase();
}

pub fn find_post_for_slug(posts: &Vec<Post>, slug_to_find: &str) -> Post {
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
            Registry { title: String::from("A few things about unit testing"), markdown: String::from("presso-pragmatic-unit-testing.md"), hidden: false },
            Registry { title: String::from("LINQ, infinity, laziness and oh my!"), markdown: String::from("linq-tips.md"), hidden: true },
        ];
        let posts: Vec<Registry> = serde_json::from_str(&raw).unwrap();

        assert_eq!(posts, expected)
    }
}