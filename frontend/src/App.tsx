import React from 'react';
import logo from './logo.svg';
import './App.css';

import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Connection, Keypair, SystemProgram, PublicKey, Transaction, sendAndConfirmTransaction, LAMPORTS_PER_SOL, ConfirmOptions, Commitment } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@project-serum/anchor';
import idl from './idl/rust_solana_nft_challenge.json';
// import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

// NodeWallet is a placeholder for your wallet manager
class NodeWallet {
    constructor(public payer: Keypair) { }

    get publicKey() {
        return this.payer.publicKey;
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        // Here, you would realistically sign the transaction using the payer's secret key.
        // This is a placeholder implementation.
        transaction.partialSign(this.payer);
        return transaction;
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        // Here, you would realistically sign all the transactions.
        // This is a placeholder implementation.
        return transactions.map(tx => {
            tx.partialSign(this.payer);
            return tx;
        });
    }
}

/**
 * Airdrops SOL to a wallet if the balance is less than 1 SOL.
 */
async function ensureFunds(connection: any, publicKey: any) {
    let balance = await connection.getBalance(publicKey);
    console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    if (balance < LAMPORTS_PER_SOL) {
        console.log(`Airdropping 1 SOL to ${publicKey.toBase58()}`);
        const airdropSignature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL);
        // Wait for the airdrop transaction to confirm
        await connection.confirmTransaction(airdropSignature, 'confirmed');
        balance = await connection.getBalance(publicKey);
        console.log(`New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    }
}

/**
 * Creates a new mint account with an airdrop if necessary.
 */
async function createMintAccount(provider: any) {
    const mintKeypair = Keypair.generate();

    // Ensure the mint account has enough SOL to cover the cost of mint creation
    await ensureFunds(provider.connection, mintKeypair.publicKey);

    const token = await Token.createMint(
        provider.connection,
        provider.wallet.payer,
        mintKeypair.publicKey,
        null,
        0, // Set decimals to 0 for non-divisible tokens (NFTs)
        TOKEN_PROGRAM_ID,
    );

    console.log(`Mint created with public key: ${token.publicKey.toBase58()}`);
    return token.publicKey;
}

const main = async () => {
    const connection = new Connection("http://127.0.0.1:8899", 'confirmed');
    const wallet = new NodeWallet(Keypair.generate());

    // Ensure the wallet has enough SOL to perform transactions
    await ensureFunds(connection, wallet.publicKey);

    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());
    const programId = new PublicKey(idl.metadata.address);
    const program = new Program(idl, programId, provider);

    // Creating the mint account for the collection
    const collectionMintPublicKey = await createMintAccount(provider);
    console.log("collectionMintPublicKey ", collectionMintPublicKey)

    const collectionKeypair = Keypair.generate();
    await ensureFunds(connection, collectionKeypair.publicKey);

    const createCollectionInstruction = program.instruction.createCollection({
        name: "My Awesome Collection",
        symbol: "MC",
        uri: "./my-metadata.json",
    }, {
        accounts: {
            collectionMetadata: collectionKeypair.publicKey,
            collectionMint: collectionMintPublicKey,
            authority: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
            rent: web3.SYSVAR_RENT_PUBKEY,
            tokenMetadataProgram: new PublicKey(idl.metadata.address), // Replace with actual ID
        },
    });

    const createCollectionTransaction = new Transaction().add(createCollectionInstruction);

    const options: ConfirmOptions = {
        skipPreflight: true,
        commitment: 'confirmed' as Commitment,
    };

    try {
        const createCollectionSignature = await sendAndConfirmTransaction(
            provider.connection, 
            createCollectionTransaction, 
            [collectionKeypair, wallet.payer], // Ensure that the payer is correctly passed if needed
            options
        );
        console.log(`Collection created with signature: ${createCollectionSignature}`);
    } catch (error) {
        console.error("Failed to create collection:", error);
    }

    const nftMetadataKeypair = Keypair.generate();
    const nftMintKeypair = Keypair.generate();

    const nftKeypair = web3.Keypair.generate();
    const mintNftInstruction = program.rpc.mintNft("./my-metadata.json", {
        accounts: {
            nftMetadata: nftMetadataKeypair.publicKey, // PublicKey for the metadata account, must be initialized
            nftMint: nftMintKeypair.publicKey, // PublicKey for the mint account of the NFT
            authority: provider.wallet.publicKey, // Your wallet public key
            systemProgram: SystemProgram.programId, // System program ID
            rent: web3.SYSVAR_RENT_PUBKEY, // Rent system variable
            tokenMetadataProgram: new PublicKey(idl.metadata.address), // Token metadata program ID, replace with actual
            collectionMint: collectionMintPublicKey // Optional, include if used in your program logic
        }
    });

    // Make sure to fund nftMetadata account if necessary
    await ensureFunds(connection, nftMetadataKeypair.publicKey);

    const mintNftTransaction = new Transaction().add(mintNftInstruction);
    try {
        const mintNftSignature = await sendAndConfirmTransaction(connection, mintNftTransaction, [nftMetadataKeypair, nftMintKeypair, wallet.payer]);
        console.log(`NFT minted with signature: ${mintNftSignature}`);
    } catch (error) {
        console.error("Error minting NFT:", error);
    }
};

main().catch(console.error);


function App() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>
                    Edit <code>src/App.tsx</code> and save to reload.
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>
        </div>
    );
}

export default App;
