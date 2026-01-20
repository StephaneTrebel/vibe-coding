use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: i64,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: i64,
    pub email: String,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Transaction {
    pub id: i64,
    pub user_id: i64,
    #[sqlx(rename = "type")]
    pub transaction_type: String,
    pub amount: f64,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTransactionRequest {
    #[serde(rename = "type")]
    pub transaction_type: String,
    pub amount: f64,
    pub category: String,
    pub description: Option<String>,
    pub date: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTransactionRequest {
    #[serde(rename = "type")]
    pub transaction_type: Option<String>,
    pub amount: Option<f64>,
    pub category: Option<String>,
    pub description: Option<String>,
    pub date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Budget {
    pub id: i64,
    pub user_id: i64,
    pub month: String,
    pub amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct SetBudgetRequest {
    pub month: String,
    pub amount: f64,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SavingsGoal {
    pub id: i64,
    pub user_id: i64,
    pub name: String,
    pub target_amount: f64,
    pub current_amount: f64,
    pub achieved: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateGoalRequest {
    pub name: String,
    pub target_amount: f64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGoalRequest {
    pub name: Option<String>,
    pub target_amount: Option<f64>,
    pub current_amount: Option<f64>,
    pub achieved: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct DashboardSummary {
    pub balance: f64,
    pub total_income: f64,
    pub total_expenses: f64,
    pub monthly_income: f64,
    pub monthly_expenses: f64,
    pub recent_transactions: Vec<Transaction>,
}
