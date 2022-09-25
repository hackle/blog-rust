mod blog;

use blog::{build_rss};
use rocket::serde::{Serialize};
use rocket::{routes, get};
use std::string::String;
use rocket_dyn_templates::Template;
use std::collections::BTreeMap;
use rocket::fs::{FileServer};
use lambda_web::{is_running_on_lambda, launch_rocket_on_lambda, LambdaError};
use rocket::response::content::Xml;

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

#[get("/rss/index.xml")]
async fn rss() -> Result<Xml<String>, String> {
    return build_rss(
        &std::env::var("REMOTE_MARKDOWN_PATH").map_err(|var_err| var_err.to_string())
    ).await
}

#[get("/<slug>")]
async fn blog_post(slug: &str) -> Template {
    // if remote fails, use local anyway
    let source = match std::env::var("REMOTE_MARKDOWN_PATH") {
        Err(_) => Err(String::from("REMOTE_MARKDOWN_PATH not set")),
        Ok(remote_url) => blog::load_remote(&remote_url, slug).await
    }.or_else(|_| blog::load_local(slug));

    let context: BTreeMap<&str, HandlebarsValue> =
        if let Ok((current_post, all_posts, markdown)) = source {
            let blog = blog::make_blog(&current_post, &all_posts, &markdown);

             BTreeMap::from([
                ("meta", HandlebarsValue::String(blog.content)),
                ("title", HandlebarsValue::String(blog.current_post.title)),
                ("description", HandlebarsValue::String(blog.description)),
                ("slug", HandlebarsValue::String(blog.current_post.slug)),
                ("see_also", HandlebarsValue::Array(blog.see_also)),
                ("date_updated", HandlebarsValue::String(blog.date_updated))
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
        .mount("/", routes![favicon, health, index, rss, blog_post])
        .attach(Template::fairing());

    if is_running_on_lambda() {
        launch_rocket_on_lambda(rocket).await?;
    } else {
        rocket.launch().await?;
    }

    Ok(())
}