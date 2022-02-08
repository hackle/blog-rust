mod blog;

use rocket::serde::{Serialize};
use rocket::{routes, get};
use std::string::String;
use std::env;
use rocket_dyn_templates::Template;
use std::collections::BTreeMap;
use std::future::Future;
use rocket::fs::{FileServer};
use lambda_web::{is_running_on_lambda, launch_rocket_on_lambda, LambdaError};
use crate::blog::{GithubSource, LocalSource, to_posts};

#[macro_use]
extern crate rocket_include_static_resources;

#[derive(Serialize)]
#[serde(untagged)]
enum HandlebarsValue {
    String(String),
    Array(Vec<(String, String)>),
}

#[get("/health")]
fn health() -> String { return String::from("OK") }

#[get("/")]
async fn index() -> Template {
    return blog_post("").await
}

#[get("/<slug>")]
async fn blog_post(slug: &str) -> Template {
    let remote_url = std::env::var("REMOTE_MARKDOWN_PATH").ok();

    let (current_post, all_posts, markdown) = if let Some(remote_url) = remote_url {
        let source = GithubSource { base_url: remote_url };
        let manifest = source.get_manifest().await.unwrap();
        let all_posts = to_posts(&manifest);
        let current_post = blog::find_post_for_slug(&all_posts, slug);
        let markdown = source.read_content(&current_post.path).await.unwrap();

        (current_post, all_posts, markdown)
    } else {
        let source = LocalSource { directory: std::env::current_dir().unwrap().join("raw") };
        let manifest = source.get_manifest().unwrap();
        let all_posts = to_posts(&manifest);
        let current_post = blog::find_post_for_slug(&all_posts, slug);
        let markdown = source.read_content(&current_post.path).unwrap();

        (current_post, all_posts, markdown)
    };

    let blog = blog::make_blog(&current_post, &all_posts, &markdown);

    let context: BTreeMap<&str, HandlebarsValue> = BTreeMap::from([
        ("meta", HandlebarsValue::String(blog.content)),
        ("title", HandlebarsValue::String(blog.current_post.title)),
        ("slug", HandlebarsValue::String(blog.current_post.slug)),
        ("see_also", HandlebarsValue::Array(blog.see_also)),
    ]);

    Template::render("main", &context)
}

static_response_handler! {
    "/favicon.ico" => favicon => "favicon",
}

#[rocket::main]
async fn main() -> Result<(), LambdaError> {
    let rocket = rocket::build()
        .attach(static_resources_initializer!(
            "favicon" => "static/favicon.ico",
        ))
        .mount("/static", FileServer::from("static"))
        .mount("/", routes![favicon, health, index, blog_post])
        .attach(Template::fairing());

    if is_running_on_lambda() {
        launch_rocket_on_lambda(rocket).await?;
    } else {
        rocket.launch().await?;
    }

    Ok(())
}