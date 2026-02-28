use axum::{
    routing::{get, post},
    Router, Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

#[derive(Deserialize, Debug)]
struct ProofRequest {
    block_number: String,
    storage_slot: String,
}

#[derive(Serialize, Debug)]
struct ProofResponse {
    success: bool,
    merkle_proof: Vec<String>,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(|| async { "BlockVault Rust Relayer Running" }))
        .route("/proof", post(generate_proof));

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    println!("Rust relayer running on http://{}", addr);

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn generate_proof(Json(payload): Json<ProofRequest>) -> Json<ProofResponse> {
    println!("Received proof request for block: {} and slot: {}", payload.block_number, payload.storage_slot);
    
    // Simulate eth_getProof RPC Call 
    let mock_merkle_proof = vec![
        "0xf90211a0...".to_string(),
        "0xf90111a0...".to_string()
    ];

    Json(ProofResponse {
        success: true,
        merkle_proof: mock_merkle_proof,
    })
}
