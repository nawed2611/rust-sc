import {
  Keypair,
  Connection,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import fs from "mz/fs";
import path from "path";

// Our keypair we used to create the onchain rust program
const PROGRAM_KEYPAIR_PATH = path.join(
  __dirname,
  "..",
  "program",
  "target",
  "deploy",
  "hello_solana-keypair.json"
);

async function main() {
  console.log("Hello World");

  // Connect to cluster
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // Read the program keypair we saved
  const programKeypairString = await fs.readFile(PROGRAM_KEYPAIR_PATH, {
    encoding: "utf8",
  });
  const programKeypairObj = JSON.parse(programKeypairString);
  const programKeypairBuffer = Uint8Array.from(programKeypairObj);
  const programKeypair = Keypair.fromSecretKey(programKeypairBuffer);

  let programId: PublicKey = programKeypair.publicKey;

  // Create a new account to store our data and generate a new public key
  const triggerKeypair = Keypair.generate();
  const airDropRequest = await connection.requestAirdrop(
    triggerKeypair.publicKey,
    LAMPORTS_PER_SOL
  );

  await connection.confirmTransaction(airDropRequest);

  // Create a new transaction instruction to invoke our onchain program
  console.log("Creating transaction...", programId.toBase58());

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: triggerKeypair.publicKey, isSigner: true, isWritable: true },
    ],
    programId,
    data: Buffer.alloc(0), // All instructions are hellos
  });

  // Create a new transaction
  sendAndConfirmTransaction(connection, new Transaction().add(instruction), [
    triggerKeypair,
  ])
    .then((res) => {
      console.log("Transaction sent", res);
    })
    .catch((err) => {
      console.error(err);
    });
}

main().catch((err) => {
  console.error(err);
});
