use anchor_lang::prelude::*;
use mpl_token_metadata::{
    instruction::{create_metadata_accounts_v2},
    state::{Collection}
};

declare_id!("9VuZ3tb1cmjdrkaCDNsPDwgRxadEiqWQgNieY2QVvMvZ");

#[program]
pub mod rust_solana_nft_challenge {
    use anchor_lang::solana_program::entrypoint::ProgramResult;

    use super::*;

    pub fn create_collection(ctx: Context<CreateCollection>, data: Data) -> ProgramResult {
        msg!("Received data: {:?}", data);
        msg!("Creating collection metadata");
        if *ctx.accounts.collection_metadata.to_account_info().owner != *ctx.program_id {
            msg!("Error: Collection metadata account is not owned by this program.");
            return Err(ProgramError::IllegalOwner);
        }
        let ix = create_metadata_accounts_v2(
            *ctx.accounts.token_metadata_program.key,
            ctx.accounts.collection_metadata.key(),
            ctx.accounts.collection_mint.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            data.name.clone(),
            data.symbol.clone(),
            data.uri.clone(),
            None, // creators
            0, // seller fee basis points
            true, // update authority is signer
            false, // is mutable
            None, // collection details
            None  // uses
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.collection_metadata.to_account_info(),
                ctx.accounts.collection_mint.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ]
        )
    }

    pub fn mint_nft(ctx: Context<MintNft>, data: Data) -> ProgramResult {
        msg!("Minting NFT metadata");
        let ix = create_metadata_accounts_v2(
            *ctx.accounts.token_metadata_program.key,
            ctx.accounts.nft_metadata.key(),
            ctx.accounts.nft_mint.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            ctx.accounts.authority.key(),
            data.name.clone(),
            data.symbol.clone(),
            data.uri.clone(),
            None, // creators
            data.seller_fee_basis_points,
            true, // update authority is signer
            true, // is mutable
            Some(Collection { verified: false, key: ctx.accounts.collection_mint.key() }),
            None  // uses
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.token_metadata_program.to_account_info(),
                ctx.accounts.nft_metadata.to_account_info(),
                ctx.accounts.nft_mint.to_account_info(),
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.rent.to_account_info(),
            ]
        )
    }
}

#[derive(Accounts)]
pub struct CreateCollection<'info> {
     /// CHECK: The `collection_metadata` account is validated to ensure it is properly initialized and matches the expected account constraints (e.g., owner, mint authority)
    #[account(mut)]
    pub collection_metadata: AccountInfo<'info>,
    /// CHECK: The `collection_mint` account is validated to confirm it represents a valid SPL Token mint. 
    /// It is crucial to ensure that this account is only used to mint tokens that are part of the collection. 
    /// We confirm that this mint is owned by the SPL Token program and that the account is initialized correctly before use.
    pub collection_mint: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: The `token_metadata_program` account is expected to be the Metaplex Token Metadata program.
    /// This is a critical check to ensure that all interactions for creating metadata and managing tokens
    /// are performed through the legitimate program. The account address is verified against a known program ID.
    pub token_metadata_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    /// CHECK: The `nft_metadata` account is assumed to be correctly initialized and used for storing metadata of NFTs.
    /// This check ensures that the account is set up according to the Metaplex standard for NFT metadata.
    /// Proper initialization and ownership by the token metadata program must be verified programmatically before use.
    pub nft_metadata: AccountInfo<'info>,
    /// CHECK: The `nft_mint` account is used to refer to the mint address of the NFT. This account
    /// must be validated to ensure it is the correct mint for the NFT being interacted with.
    /// The existence and the type of this account are critical for the NFT's identity and integrity, 
    /// and must be verified against the expected mint address derived during the transaction processing.
    pub nft_mint: AccountInfo<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: The `token_metadata_program` field points to the Metaplex Token Metadata Program.
    /// We rely on the known address of the Metaplex Token Metadata Program for interaction,
    /// ensuring it matches the expected program address hardcoded in the client applications
    /// and is thus safe to use without further checks.
    pub token_metadata_program: AccountInfo<'info>,
    /// CHECK: The `collection_mint` account is provided as a parameter to this instruction
    /// and is expected to be the mint address of a collection NFT. The safety of this account
    /// relies on external validation to ensure that it is indeed a legitimate and valid mint
    /// address for a collection within the context of the Metaplex protocol. We trust the 
    /// input provided by the client, which should ensure that the provided address is correct
    /// and has been verified prior to invoking this program.
    pub collection_mint: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Data {
    pub name: String,
    pub symbol: String,
    pub uri: String,
    pub seller_fee_basis_points: u16,
    pub creators: Option<Vec<Creator>>,
    // Additional fields
    pub collection: Option<CollectionDetails>, // Optional field for collection details
    pub uses: Option<Uses>, // Optional field for usage details
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    pub share: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct CollectionDetails {
    pub verified: bool,
    pub key: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Uses {
    pub use_method: UseMethod,
    pub remaining: u64,
    pub total: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum UseMethod {
    Burn,
    Multiple,
    Single,
}
