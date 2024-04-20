// import { Connection, Keypair, SystemProgram, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
// import { AnchorProvider, Program, web3, workspace } from '@project-serum/anchor';
// const idl = require('./../target/idl/rust_solana_nft_challenge.json');
// import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';

// const main = async () => {
//     const connection = new Connection("http://127.0.0.1:8899", 'confirmed');
//     const wallet = new NodeWallet(Keypair.generate());
//     const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions());

//     const programId = new PublicKey(idl.metadata.address);
//     const program = workspace.MyNftProject ? workspace.MyNftProject as Program : new Program(idl, programId, provider);

//     const collectionKeypair = web3.Keypair.generate();
//     const createCollectionInstruction = program.instruction.createCollection("My Awesome Collection", {
//         accounts: {
//             collection: collectionKeypair.publicKey,
//             user: provider.wallet.publicKey,
//             systemProgram: SystemProgram.programId,
//         }
//     });

//     const createCollectionTransaction = new Transaction().add(createCollectionInstruction);
//     const createCollectionSignature = await sendAndConfirmTransaction(connection, createCollectionTransaction, [collectionKeypair, wallet.payer]);
//     console.log(`Collection created with signature: ${createCollectionSignature}`);

//     const nftKeypair = web3.Keypair.generate();
//     const mintNftInstruction = program.instruction.mintNft("https://my.metadata.uri/nft", {
//         accounts: {
//             nft: nftKeypair.publicKey,
//             minter: provider.wallet.publicKey,
//             systemProgram: SystemProgram.programId,
//         }
//     });

//     const mintNftTransaction = new Transaction().add(mintNftInstruction);
//     const mintNftSignature = await sendAndConfirmTransaction(connection, mintNftTransaction, [nftKeypair, wallet.payer]);
//     console.log(`NFT minted with signature: ${mintNftSignature}`);
// };

// main().catch(console.error);
