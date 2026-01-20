use crate::{
    error::AppError,
    models::{CreateTransactionRequest, Transaction, UpdateTransactionRequest},
    routes::AuthUser,
    AppState,
};
use axum::{
    extract::{Path, Query, State},
    Json,
};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct ListParams {
    pub month: Option<String>,
    pub category: Option<String>,
    #[serde(rename = "type")]
    pub transaction_type: Option<String>,
}

pub async fn list(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(params): Query<ListParams>,
) -> Result<Json<Vec<Transaction>>, AppError> {
    let mut query = String::from(
        "SELECT id, user_id, type, amount, category, description, date, created_at
         FROM transactions WHERE user_id = ?",
    );

    if let Some(ref month) = params.month {
        query.push_str(&format!(" AND strftime('%Y-%m', date) = '{}'", month));
    }

    if let Some(ref category) = params.category {
        query.push_str(&format!(" AND category = '{}'", category));
    }

    if let Some(ref t) = params.transaction_type {
        query.push_str(&format!(" AND type = '{}'", t));
    }

    query.push_str(" ORDER BY date DESC, created_at DESC");

    let transactions = sqlx::query_as::<_, Transaction>(&query)
        .bind(claims.sub)
        .fetch_all(&state.db)
        .await?;

    Ok(Json(transactions))
}

pub async fn create(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(req): Json<CreateTransactionRequest>,
) -> Result<Json<Transaction>, AppError> {
    if req.transaction_type != "income" && req.transaction_type != "expense" {
        return Err(AppError::BadRequest(
            "Type must be 'income' or 'expense'".to_string(),
        ));
    }

    if req.amount <= 0.0 {
        return Err(AppError::BadRequest("Amount must be positive".to_string()));
    }

    let result = sqlx::query(
        "INSERT INTO transactions (user_id, type, amount, category, description, date)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(claims.sub)
    .bind(&req.transaction_type)
    .bind(req.amount)
    .bind(&req.category)
    .bind(&req.description)
    .bind(&req.date)
    .execute(&state.db)
    .await?;

    let transaction = sqlx::query_as::<_, Transaction>(
        "SELECT id, user_id, type, amount, category, description, date, created_at
         FROM transactions WHERE id = ?",
    )
    .bind(result.last_insert_rowid())
    .fetch_one(&state.db)
    .await?;

    Ok(Json(transaction))
}

pub async fn update(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i64>,
    Json(req): Json<UpdateTransactionRequest>,
) -> Result<Json<Transaction>, AppError> {
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM transactions WHERE id = ? AND user_id = ?",
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    if existing == 0 {
        return Err(AppError::NotFound("Transaction not found".to_string()));
    }

    if let Some(ref t) = req.transaction_type {
        if t != "income" && t != "expense" {
            return Err(AppError::BadRequest(
                "Type must be 'income' or 'expense'".to_string(),
            ));
        }
    }

    if let Some(amount) = req.amount {
        if amount <= 0.0 {
            return Err(AppError::BadRequest("Amount must be positive".to_string()));
        }
    }

    let mut updates = Vec::new();

    if let Some(ref t) = req.transaction_type {
        updates.push(format!("type = '{}'", t));
    }
    if let Some(amount) = req.amount {
        updates.push(format!("amount = {}", amount));
    }
    if let Some(ref category) = req.category {
        updates.push(format!("category = '{}'", category));
    }
    if let Some(ref description) = req.description {
        updates.push(format!("description = '{}'", description));
    }
    if let Some(ref date) = req.date {
        updates.push(format!("date = '{}'", date));
    }

    if !updates.is_empty() {
        let query = format!(
            "UPDATE transactions SET {} WHERE id = ? AND user_id = ?",
            updates.join(", ")
        );
        sqlx::query(&query)
            .bind(id)
            .bind(claims.sub)
            .execute(&state.db)
            .await?;
    }

    let transaction = sqlx::query_as::<_, Transaction>(
        "SELECT id, user_id, type, amount, category, description, date, created_at
         FROM transactions WHERE id = ?",
    )
    .bind(id)
    .fetch_one(&state.db)
    .await?;

    Ok(Json(transaction))
}

pub async fn delete(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(id): Path<i64>,
) -> Result<Json<serde_json::Value>, AppError> {
    let result = sqlx::query("DELETE FROM transactions WHERE id = ? AND user_id = ?")
        .bind(id)
        .bind(claims.sub)
        .execute(&state.db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Transaction not found".to_string()));
    }

    Ok(Json(serde_json::json!({ "success": true })))
}
