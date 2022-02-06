mod blog;

use rocket::serde::{Serialize};
use std::path::PathBuf;
use rocket::{routes, get, Config, Rocket, Build};
use regex::Regex;
use std::string::String;
use std::env;
use comrak::{markdown_to_html, ComrakOptions};
use rocket_dyn_templates::Template;
use std::collections::BTreeMap;
use rocket::fs::{FileServer};
use lambda_web::{is_running_on_lambda, launch_rocket_on_lambda, LambdaError};
use rocket_include_static_resources::{EtagIfNoneMatch, StaticContextManager, StaticResponse};

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
fn index() -> Template {
    return blog_post("")
}

#[get("/<slug>")]
fn blog_post(slug: &str) -> Template {
    let mut md_dir = env::current_dir().unwrap();
    md_dir.push("raw");

    let manifest = blog::read_manifest(&md_dir);
    let blog = blog::make_blog(slug, &manifest, |p: &PathBuf| std::fs::read_to_string(p));

    let mut context: BTreeMap<&str, HandlebarsValue> = BTreeMap::new();
    
    context.insert("meta", HandlebarsValue::String(blog.content));
    context.insert("title", HandlebarsValue::String(blog.current_post.title));
    context.insert("slug", HandlebarsValue::String(blog.current_post.slug));
    context.insert("see_also", HandlebarsValue::Array(blog.see_also));

    return Template::render("main", &context);
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
        .mount("/", routes![favicon, index, blog_post])
        .attach(Template::fairing());

    if is_running_on_lambda() {
        launch_rocket_on_lambda(rocket).await?;
    } else {
        rocket.launch().await?;
    }

    Ok(())
}