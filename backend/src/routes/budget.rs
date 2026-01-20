use crate::{
    error::AppError,
    models::{Budget, SetBudgetRequest},
    routes::AuthUser,
    AppState,
};
use axum::{
    extract::{Path, State},
    Json,
};
use std::sync::Arc;

pub async fn get(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(month): Path<String>,
) -> Result<Json<Option<Budget>>, AppError> {
    let budget = sqlx::query_as::<_, Budget>(
        "SELECT id, user_id, month, amount FROM budgets WHERE user_id = ? AND month = ?",
    )
    .bind(claims.sub)
    .bind(&month)
    .fetch_optional(&state.db)
    .await?;

    Ok(Json(budget))
}

pub async fn set(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(req): Json<SetBudgetRequest>,
) -> Result<Json<Budget>, AppError> {
    if req.amount < 0.0 {
        return Err(AppError::BadRequest(
            "Budget amount cannot be negative".to_string(),
        ));
    }

    sqlx::query(
        "INSERT INTO budgets (user_id, month, amount) VALUES (?, ?, ?)
         ON CONFLICT(user_id, month) DO UPDATE SET amount = excluded.amount",
    )
    .bind(claims.sub)
    .bind(&req.month)
    .bind(req.amount)
    .execute(&state.db)
    .await?;

    let budget = sqlx::query_as::<_, Budget>(
        "SELECT id, user_id, month, amount FROM budgets WHERE user_id = ? AND month = ?",
    )
    .bind(claims.sub)
    .bind(&req.month)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(budget))
}
