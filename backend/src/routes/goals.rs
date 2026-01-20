use crate::{
    error::AppError,
    models::{CreateGoalRequest, SavingsGoal, UpdateGoalRequest},
    routes::AuthUser,
    AppState,
};
use axum::{
    extract::{Path, State},
    Json,
};
use std::sync::Arc;

pub async fn list(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<Vec<SavingsGoal>>, AppError> {
    let goals = sqlx::query_as::<_, SavingsGoal>(
        "SELECT id, user_id, name, target_amount, current_amount, achieved, created_at
         FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC",
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(goals))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(req): Json<CreateGoalRequest>,
) -> Result<Json<SavingsGoal>, AppError> {
    if req.name.is_empty() {
        return Err(AppError::BadRequest("Goal name is required".to_string()));
    }

    if req.target_amount <= 0.0 {
        return Err(AppError::BadRequest(
            "Target amount must be positive".to_string(),
        ));
    }

    let result = sqlx::query(
        "INSERT INTO savings_goals (user_id, name, target_amount) VALUES (?, ?, ?)",
    )
    .bind(claims.sub)
    .bind(&req.name)
    .bind(req.target_amount)
    .execute(&state.db)
    .await?;

    let goal = sqlx::query_as::<_, SavingsGoal>(
        "SELECT id, user_id, name, target_amount, current_amount, achieved, created_at
         FROM savings_goals WHERE id = ?",
    )
    .bind(result.last_insert_rowid())
    .fetch_one(&state.db)
    .await?;

    Ok(Json(goal))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i64>,
    Json(req): Json<UpdateGoalRequest>,
) -> Result<Json<SavingsGoal>, AppError> {
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM savings_goals WHERE id = ? AND user_id = ?",
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    if existing == 0 {
        return Err(AppError::NotFound("Goal not found".to_string()));
    }

    let mut updates = Vec::new();

    if let Some(ref name) = req.name {
        if name.is_empty() {
            return Err(AppError::BadRequest("Goal name cannot be empty".to_string()));
        }
        updates.push(format!("name = '{}'", name));
    }

    if let Some(target_amount) = req.target_amount {
        if target_amount <= 0.0 {
            return Err(AppError::BadRequest(
                "Target amount must be positive".to_string(),
            ));
        }
        updates.push(format!("target_amount = {}", target_amount));
    }

    if let Some(current_amount) = req.current_amount {
        if current_amount < 0.0 {
            return Err(AppError::BadRequest(
                "Current amount cannot be negative".to_string(),
            ));
        }
        updates.push(format!("current_amount = {}", current_amount));
    }

    if let Some(achieved) = req.achieved {
        updates.push(format!("achieved = {}", if achieved { 1 } else { 0 }));
    }

    if !updates.is_empty() {
        let query = format!(
            "UPDATE savings_goals SET {} WHERE id = ? AND user_id = ?",
            updates.join(", ")
        );
        sqlx::query(&query)
            .bind(id)
            .bind(claims.sub)
            .execute(&state.db)
            .await?;
    }

    let goal = sqlx::query_as::<_, SavingsGoal>(
        "SELECT id, user_id, name, target_amount, current_amount, achieved, created_at
         FROM savings_goals WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(goal))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM savings_goals WHERE id = ? AND user_id = ?")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Goal not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}
