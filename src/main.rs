#![feature(async_closure)]

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
use crate::blog::{GithubSource, LocalSource, Post, to_posts};

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

async fn load_remote(remote_url: &String, slug: &str) -> Result<(Post, Vec<Post>, String), String> {
    let source = GithubSource { base_url: remote_url.to_owned() };

    return match source.get_manifest().await {
        Err(_) => Err(String::from("Loading manifest failed")),
        Ok(manifest) => {
            let all_posts = to_posts(&manifest);
            let current_post = blog::find_post_for_slug(&all_posts, slug);

            return match source.read_content(&current_post.path).await {
                Err(_) => Err(String::from("Reading current post failed")),
                Ok(content) => Ok((current_post, all_posts, content))
            };
        }
    };
}

fn load_local(slug: &str) -> Result<(Post, Vec<Post>, String), String> {
        let source = LocalSource { directory: std::env::current_dir().unwrap().join("raw") };
        return source.get_manifest().and_then(|manifest| {
            let all_posts = to_posts(&manifest);
            let current_post = blog::find_post_for_slug(&all_posts, slug);
            return source.read_content(&current_post.path).map(|content| (current_post, all_posts, content));
        });
}

#[get("/<slug>")]
async fn blog_post(slug: &str) -> Template {
    let source = match std::env::var("REMOTE_MARKDOWN_PATH") {
        Err(str) => Err(String::from("REMOTE_MARKDOWN_PATH not set")),
        Ok(remote_url) => load_remote(&remote_url, slug).await
    }.or_else(|_| load_local(slug));

    // if remote fails, use local anyway
    let context: BTreeMap<&str, HandlebarsValue> =
        if let Ok((current_post, all_posts, markdown)) = source {
            let blog = blog::make_blog(&current_post, &all_posts, &markdown);

             BTreeMap::from([
                ("meta", HandlebarsValue::String(blog.content)),
                ("title", HandlebarsValue::String(blog.current_post.title)),
                ("slug", HandlebarsValue::String(blog.current_post.slug)),
                ("see_also", HandlebarsValue::Array(blog.see_also)),
            ])
        } else {
            BTreeMap::from([
                ("meta", HandlebarsValue::String(String::from("Oh no! Something is not right")))
            ])
        };

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