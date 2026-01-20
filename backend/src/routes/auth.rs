use crate::{
    error::AppError,
    models::{AuthResponse, Claims, LoginRequest, RegisterRequest, UserResponse},
    AppState,
};
use argon2::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::rngs::OsRng;
use axum::{extract::State, Json};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::sync::Arc;

pub async fn register(
    State(state): State<Arc<AppState>>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    if req.email.is_empty() || !req.email.contains('@') {
        return Err(AppError::BadRequest("Invalid email".to_string()));
    }

    if req.password.len() < 6 {
        return Err(AppError::BadRequest(
            "Password must be at least 6 characters".to_string(),
        ));
    }

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = ?")
        .bind(&req.email)
        .fetch_one(&state.db)
        .await?;

    if existing > 0 {
        return Err(AppError::BadRequest("Email already registered".to_string()));
    }

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(req.password.as_bytes(), &salt)?
        .to_string();

    let result = sqlx::query("INSERT INTO users (email, password_hash) VALUES (?, ?)")
        .bind(&req.email)
        .bind(&password_hash)
        .execute(&state.db)
        .await?;

    let user_id = result.last_insert_rowid();

    let claims = Claims {
        sub: user_id,
        email: req.email.clone(),
        exp: (chrono::Utc::now() + chrono::Duration::days(7)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )?;

    Ok(Json(AuthResponse {
        token,
        user: UserResponse {
            id: user_id,
            email: req.email,
        },
    }))
}

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<AuthResponse>, AppError> {
    let user = sqlx::query_as::<_, (i64, String, String)>(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
    )
    .bind(&req.email)
    .fetch_optional(&state.db)
    .await?
    .ok_or_else(|| AppError::Unauthorized("Invalid credentials".to_string()))?;

    let (user_id, email, password_hash) = user;

    let parsed_hash = PasswordHash::new(&password_hash)
        .map_err(|_| AppError::Internal("Password hash error".to_string()))?;

    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized("Invalid credentials".to_string()))?;

    let claims = Claims {
        sub: user_id,
        email: email.clone(),
        exp: (chrono::Utc::now() + chrono::Duration::days(7)).timestamp() as usize,
    };

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.jwt_secret.as_bytes()),
    )?;

    Ok(Json(AuthResponse {
        token,
        user: UserResponse { id: user_id, email },
    }))
}
