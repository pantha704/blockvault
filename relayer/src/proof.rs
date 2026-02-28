use ethers::prelude::*;
use std::str::FromStr;
use std::sync::Arc;

pub async fn fetch_storage_proof(
    block_number_hex: &str,
    storage_slot_hex: &str,
    rpc_url: &str,
) -> Result<EIP1186ProofResponse, Box<dyn std::error::Error>> {
    
    // Connect to the RPC provider
    let provider = Provider::<Http>::try_from(rpc_url)?;
    let client = Arc::new(provider);

    // Mock target contract (e.g., a specific ERC20 token or Aave Pool)
    // In production, this would be passed from the Bun AI or hardcoded to known protocols
    let target_contract = Address::from_str("0xdAC17F958D2ee523a2206206994597C13D831ec7")?; // USDT for demo

    // Parse the block number and storage slot
    let block_number: BlockNumber = block_number_hex.parse()?;
    
    let slot_bytes = hex::decode(storage_slot_hex.trim_start_matches("0x"))?;
    let mut slot_arr = [0u8; 32];
    let copy_len = std::cmp::min(slot_bytes.len(), 32);
    slot_arr[32 - copy_len..].copy_from_slice(&slot_bytes[..copy_len]);
    let storage_slot = H256::from(slot_arr);

    // Make the actual eth_getProof RPC call
    println!("Querying eth_getProof for slot {:?} at block {:?}", storage_slot, block_number);
    let proof = client
        .get_proof(target_contract, vec![storage_slot], Some(block_number.into()))
        .await?;

    Ok(proof)
}
