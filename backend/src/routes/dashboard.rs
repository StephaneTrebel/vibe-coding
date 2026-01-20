use crate::{
    error::AppError,
    models::{DashboardSummary, Transaction},
    routes::AuthUser,
    AppState,
};
use axum::{extract::State, Json};
use std::sync::Arc;

pub async fn summary(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<Json<DashboardSummary>, AppError> {
    let total_income = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE user_id = ? AND type = 'income'",
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    let total_expenses = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE user_id = ? AND type = 'expense'",
    )
    .bind(claims.sub)
    .fetch_one(&state.db)
    .await?;

    let current_month = chrono::Utc::now().format("%Y-%m").to_string();

    let monthly_income = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions
         WHERE user_id = ? AND type = 'income' AND strftime('%Y-%m', date) = ?",
    )
    .bind(claims.sub)
    .bind(&current_month)
    .fetch_one(&state.db)
    .await?;

    let monthly_expenses = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions
         WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?",
    )
    .bind(claims.sub)
    .bind(&current_month)
    .fetch_one(&state.db)
    .await?;

    let recent_transactions = sqlx::query_as::<_, Transaction>(
        "SELECT id, user_id, type, amount, category, description, date, created_at
         FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 10",
    )
    .bind(claims.sub)
    .fetch_all(&state.db)
    .await?;

    Ok(Json(DashboardSummary {
        balance: total_income - total_expenses,
        total_income,
        total_expenses,
        monthly_income,
        monthly_expenses,
        recent_transactions,
    }))
}
