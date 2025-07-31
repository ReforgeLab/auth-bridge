import { bcs, fromBase64 } from "@mysten/bcs";
import type { SuiClient } from "@mysten/sui/client";
import type { IntentScope } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

export class AuthBridgeSdk {
	private readonly privateKey: Ed25519Keypair;
	constructor(privateKey: Uint8Array | string) {
		if (Array.isArray(privateKey) && privateKey.length == 32) {
			this.privateKey = Ed25519Keypair.fromSecretKey(privateKey);
		} else if (typeof privateKey === "string") {
			this.privateKey = Ed25519Keypair.deriveKeypairFromSeed(privateKey);
		}
	}

	async initializeProtocol() {}
	async storeCap() {}
	async signin() {}
	async borrowCap() {}
	async returnCap() {}
}

// const secretKey: Uint8Array = new Uint8Array([
// 	63, 217, 166, 31, 143, 245, 126, 83, 111, 198, 201, 84, 160, 127, 235, 0,
// 	34, 112, 14, 156, 125, 115, 68, 155, 146, 48, 192, 155, 74, 86, 207, 98,
// ]);
//
// const keypair = Ed25519Keypair.fromSecretKey(secretKey);
// const suiAddress = keypair.toSuiAddress();
// console.log("Sui address:", suiAddress);
// const publicAdderss = keypair.getPublicKey().toRawBytes();
// console.log(
// 	"Public key (hex):",
// 	Array.from(publicAdderss)
// 		.map((b) => b.toString(16).padStart(2, "0"))
// 		.join(""),
// );
// // const hexAddress = bcs.string().h;
// // console.log("Keypair address:", keypair.toSuiAddress());
//
// // const message = "Hello, my name is Quentin!";
//
// // Step 1: Convert message to bytes
// const msgOne = address;
// const msg = msgOne.concat(
// 	"8",
// 	"0000000000000000000000000000000000000000000000000000000000000000::auth_tests::TestKey",
// 	"ron102",
// );
// //0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>
// console.log("Message to sign:", msg);
// const messageBytes = new TextEncoder().encode(msg);
//
// console.log("Message bytes (bytes):", messageBytes);
//
// console.log(
// 	"Message bytes (Hex):",
// 	Array.from(messageBytes)
// 		.map((b) => b.toString(16).padStart(2, "0"))
// 		.join(""),
// );
//
// const signResult = await keypair.signPersonalMessage(messageBytes);
//
// const fullSigBytes: Uint8Array = fromBase64(signResult.signature);

