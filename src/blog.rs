use std::path::PathBuf;
use chrono::{DateTime, Utc};
use comrak::{ComrakExtensionOptions, ComrakOptions, markdown_to_html};
use regex::Regex;
use rocket::response::content::Xml;
use rss::{ItemBuilder, ChannelBuilder, Item};
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
    pub path: String,
    pub hidden: bool,
    pub updated: DateTime<Utc>
}

#[derive(Clone, Debug, Deserialize, PartialEq, Eq)]
pub struct Registry {
    pub title: String,
    pub markdown: String,
    #[serde(default)]
    pub hidden: bool,
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

    pub fn default() -> LocalSource {
        return LocalSource { directory: std::env::current_dir().unwrap().join("raw") }
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

    pub fn new(remote_url: &String) -> GithubSource {
        return GithubSource { base_url: remote_url.to_owned() };
    }
}

pub async fn load_all_posts_remote(source: &GithubSource) -> Result<Vec<Post>, String> {
    return match source.get_manifest().await {
        Err(_) => Err(String::from("Loading manifest failed")),
        Ok(manifest) => Ok(to_posts(&manifest))
    };
}

pub async fn load_remote(remote_url: &String, slug: &str) -> Result<(Post, Vec<Post>, String), String> {
    let source = GithubSource::new(remote_url);

    return match load_all_posts_remote(&source).await {
        Ok(all_posts) => {
            let current_post = find_post_for_slug(&all_posts, slug);

            return match source.read_content(&current_post.path).await {
                Err(_) => Err(String::from("Reading current post failed")),
                Ok(content) => Ok((current_post, all_posts, content))
            };
        },
        Err(err) => Err(err)
    };
}

pub fn load_all_posts_local(source: &LocalSource) -> Result<Vec<Post>, String> {
    return source.get_manifest()
        .map(|manifest| to_posts(&manifest));
}

pub fn load_local(slug: &str) -> Result<(Post, Vec<Post>, String), String> {
    let source = LocalSource::default();

    return load_all_posts_local(&source).and_then(|all_posts| {
        let current_post = find_post_for_slug(&all_posts, slug);
        return source.read_content(&current_post.path).map(|content| (current_post, all_posts, content));
    });
}

pub fn to_posts(registries: &Vec<Registry>) -> Vec<Post> {
    return registries.iter()
        .map(|Registry{ title, markdown, hidden } | Post {
            title: title.to_owned(),
            slug: to_slug(title),
            path: markdown.to_owned(),
            hidden: *hidden,
            updated: Utc::now(),
        })
        .rev()
        .collect();
}

pub fn make_blog(current_post: &Post, all_posts: &Vec<Post>, markdown: &String) -> Blog {
    let options = ComrakOptions {
        extension: ComrakExtensionOptions {
            table: true,
            ..ComrakExtensionOptions::default()
        },
        ..ComrakOptions::default()
    };
    let content =  markdown_to_html(&markdown.to_string(), &options);

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
        .find(|Post { slug, path,.. } | slug == slug_to_find || *path == format!("{}.md", slug_to_find))
        .unwrap_or_else(|| posts.iter().filter(|Post{hidden, ..}| !*hidden).nth(0).unwrap())
        .to_owned();
}

pub async fn build_rss(remote_url: &Result<String, String>) -> Result<Xml<String>, String> {
    let all_posts = match remote_url {
        Ok(remote_url) => load_all_posts_remote(&GithubSource::new(&remote_url)).await,
        Err(var_err) => Err(var_err.to_string())
    }.or_else(|_| load_all_posts_local(&LocalSource::default()));

    let host_name = "https://hacklewayne.com";

    return all_posts.and_then(|posts| {
            let items: Vec<Item> = posts.iter()
                .map(|post| ItemBuilder::default()
                    .title(Some(post.title.to_owned()))
                    .link(Some(format!("{}/{}", host_name, post.slug)))
                    .pub_date(Some(format!("{}", post.updated.format("%Y-%m-%dT%H:%M:%SZ"))))
                    .build()
                )
                .collect();

            let channel = ChannelBuilder::default()
            .title("Hackle's blog")
            .link(host_name)
            .description("Hackle Wayne's blog about many nerdy things")
            .items(items)
            .build();
    
            return Ok(Xml(channel.to_string()));
        });
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