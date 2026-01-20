mod db;
mod error;
mod models;
mod routes;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub struct AppState {
    pub db: sqlx::SqlitePool,
    pub jwt_secret: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite:./data/budget.db".to_string());

    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    db::init_db(&pool).await?;

    let state = Arc::new(AppState {
        db: pool,
        jwt_secret,
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/health", get(|| async { "OK" }))
        // Auth routes
        .route("/api/auth/register", post(routes::auth::register))
        .route("/api/auth/login", post(routes::auth::login))
        // Transaction routes
        .route("/api/transactions", get(routes::transactions::list))
        .route("/api/transactions", post(routes::transactions::create))
        .route("/api/transactions/{id}", put(routes::transactions::update))
        .route("/api/transactions/{id}", delete(routes::transactions::delete))
        // Budget routes
        .route("/api/budget/{month}", get(routes::budget::get))
        .route("/api/budget", post(routes::budget::set))
        // Goals routes
        .route("/api/goals", get(routes::goals::list))
        .route("/api/goals", post(routes::goals::create))
        .route("/api/goals/{id}", put(routes::goals::update))
        .route("/api/goals/{id}", delete(routes::goals::delete))
        // Dashboard route
        .route("/api/dashboard/summary", get(routes::dashboard::summary))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("Server running on http://0.0.0.0:3000");
    axum::serve(listener, app).await?;

    Ok(())
}
