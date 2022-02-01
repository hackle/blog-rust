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
use rocket::fs::FileServer;

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

    let blog = blog::make_blog(slug, &md_dir);

    let mut context: BTreeMap<&str, HandlebarsValue> = BTreeMap::new();
    
    context.insert("meta", HandlebarsValue::String(blog.Content));
    context.insert("title", HandlebarsValue::String(blog.Title));
    context.insert("slug", HandlebarsValue::String(blog.Slug));
    context.insert("see_also", HandlebarsValue::Array(blog.SeeAlso));

    return Template::render("main", &context);
}

#[rocket::launch]
fn router() -> _ {
    rocket::build()
        .mount("/static", FileServer::from("static"))
        .mount("/", routes![index, blog_post])
        .attach(Template::fairing())
}