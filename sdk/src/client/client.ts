import { fromBase64 } from "@mysten/bcs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import axios from "axios";
import type {
	BorrowCapParams,
	ConstructSignatureParams,
	InitializeParams,
	ReturnCapParams,
	SigninParams,
	WithdrawCapParams,
} from "./../types";

const packageId =
	"0x90c2c698a0e764a4821675cf74c306533bbb8df57b2e590a24faf86ecc252788";
const registry =
	"0xa18665103fe3c21085e1f0447933eabc6c7d3c5ca480fc89b808f0964d2b621f";

/**
 * Authentication Bridge SDK
 *
 * This SDK is primarily meant for backend use, but the signing functions can be used in frontend as well.
 * Provides secure capability management through centralized signature verification.
 *
 * @example
 * ```typescript
 * // Backend usage with private key
 * const sdk = new AuthBridgeSdk(privateKeyBytes);
 *
 * // Frontend usage without private key (using signature service)
 * const sdk = new AuthBridgeSdk();
 * ```
 */
export class AuthBridgeSdk {
	private readonly privateKey: Ed25519Keypair | undefined;

	/**
	 * Creates a new AuthBridgeSdk instance
	 *
	 * @param privateKey - Optional private key for signing. Can be Uint8Array (32 bytes) or string seed
	 *
	 * @example
	 * ```typescript
	 * // Using raw private key bytes
	 * const sdk = new AuthBridgeSdk(privateKeyBytes);
	 *
	 * // Using seed string
	 * const sdk = new AuthBridgeSdk("your-seed-string");
	 *
	 * // Without private key (for frontend usage)
	 * const sdk = new AuthBridgeSdk();
	 * ```
	 */
	constructor(privateKey?: Uint8Array | string) {
		if (Array.isArray(privateKey) && privateKey.length === 32) {
			this.privateKey = Ed25519Keypair.fromSecretKey(privateKey);
		} else if (typeof privateKey === "string") {
			this.privateKey = Ed25519Keypair.deriveKeypairFromSeed(privateKey);
		}
	}

	/**
	 * Initialize the authentication protocol on-chain.
	 *
	 * Creates a protocol wrapper object that stores the configuration and wraps the
	 * capability in a secure holder that requires authentication to access.
	 *
	 * @param params - Configuration parameters for initialization
	 * @param params.key - The capability object to be stored securely (e.g., MintCap from an NFT collection)
	 * @param params.input_keys - Keys used to construct the message for signing (sender and type are added automatically)
	 * @param params.output_keys - Keys returned after successful signin, wrapped in the Authentication object
	 * @param params.protocol - The protocol object (e.g., NFT collection object)
	 * @param params.centralizedAddress - Address of the centralized service that signs messages
	 * @param params.capType - The capability type (e.g., "MintCap")
	 * @param params.protocolType - The protocol type (e.g., "Collection")
	 * @param params.tx - Transaction object to append the move call
	 *
	 * @returns Promise resolving to the updated transaction
	 *
	 * @example
	 * ```typescript
	 * const tx = new Transaction();
	 *
	 * await sdk.initialize({
	 *   key: "0x123...", // MintCap object ID
	 *   input_keys: ["amount", "recipient"],
	 *   output_keys: ["recipient"],
	 *   protocol: "0x456...", // Collection object ID
	 *   centralizedAddress: "0x789...",
	 *   capType: "0xabc::nft::MintCap",
	 *   protocolType: "0xabc::nft::Collection",
	 *   tx
	 * });
	 * ```
	 */
	async initialize({
		key,
		input_keys,
		output_keys,
		protocol,
		centralizedAddress,
		capType,
		protocolType,
		tx,
	}: InitializeParams): Promise<Transaction> {
		capType = this.fixType(capType);
		protocolType = this.fixType(protocolType);
		input_keys.push("sender");
		input_keys.push("type");
		tx.moveCall({
			target: `${packageId}::authentication::default`,
			arguments: [
				tx.object(registry),
				tx.object(key),
				tx.pure.address(centralizedAddress),
				tx.pure.vector("string", input_keys),
				tx.pure.vector("string", output_keys),
				tx.object(protocol),
			],
			typeArguments: [capType, protocolType],
		});

		return tx;
	}

	/**
	 * Sign in to the authentication protocol with a verified signature.
	 *
	 * Verifies the Ed25519 signature on-chain and returns an Authentication object
	 * that can be used to borrow the secured capability.
	 *
	 * @param params - Signin parameters
	 * @param params.protocolWrapper - The protocol wrapper object containing the configuration
	 * @param params.holderCap - The holder capability wrapper (e.g., wrapper of MintCap)
	 * @param params.fullSignature - The full signature from constructSignature function
	 * @param params.data - Key/value pairs for the message (must match input_keys from initialize)
	 * @param params.capType - The capability type (e.g., "0xabc::nft::MintCap")
	 * @param params.protocolType - The protocol type (e.g., "0xabc::nft::Collection")
	 * @param params.tx - Transaction object to append the move call
	 *
	 * @returns Promise resolving to transaction and authentication object
	 *
	 * @example
	 * ```typescript
	 * const data = new Map([
	 *   ["amount", "1000"],
	 *   ["recipient", "0x123..."]
	 * ]);
	 *
	 * const tx = new Transaction();
	 *
	 * const { transaction, authentication } = await sdk.signin({
	 *   protocolWrapper: "0x456...",
	 *   holderCap: "0x789...",
	 *   fullSignature: signatureBytes,
	 *   data,
	 *   capType: "0xabc::nft::MintCap",
	 *   protocolType: "0xabc::nft::Collection",
	 *   tx:
	 * });
	 * ```
	 *
	 * @note sender and type are added automatically - don't include them in the data map
	 * @note The keys in data must match the input_keys provided in the initialize function
	 */
	async signin({
		protocolWrapper,
		holderCap,
		fullSignature,
		data,
		capType,
		protocolType,
		tx,
	}: SigninParams): Promise<{
		transaction: Transaction;
		authentication: any;
	}> {
		data.set("sender", "");
		data.set("type", "");

		const StringType = "00000000000000000000000000000001::string::String";

		const [vecMap] = tx.moveCall({
			target: `0x2::vec_map::empty`,
			typeArguments: [StringType, StringType],
		});

		for (let [key, value] of data) {
			if (value.startsWith("0x1") || value.startsWith("0x2"))
				value = this.appendZeros(value);
			tx.moveCall({
				target: `0x2::vec_map::insert`,
				arguments: [vecMap as any, tx.pure.string(key), tx.pure.string(value)],
				typeArguments: [StringType, StringType],
			});
		}

		const [authentication] = tx.moveCall({
			target: `${packageId}::authentication::signin`,
			arguments: [
				tx.object(protocolWrapper),
				tx.object(holderCap),
				tx.pure.vector("u8", Array.from(fullSignature)),
				vecMap as any,
			],
			typeArguments: [this.fixType(capType), this.fixType(protocolType)],
		});
		return {
			transaction: tx,
			authentication,
		};
	}

	/**
	 * Construct a signature for authentication.
	 *
	 * Either a privateKey must be provided in the constructor, or a signatureUrl must be provided.
	 * The message format is: sendersAddress,capType,protocolType[,message][,salt]
	 *
	 * @param params - Signature construction parameters
	 * @param params.sendersAddress - Address of the sender who will call the signin function
	 * @param params.capType - The capability type (e.g., "0xabc::nft::MintCap")
	 * @param params.protocolType - The protocol type (e.g., "0xabc::nft::Collection")
	 * @param params.signatureUrl - Optional URL to a signing service (if no private key in constructor)
	 * @param params.options.message - Optional array of additional message parts (e.g., allowed actions, nonce)
	 * @param params.options.salt - Optional salt to add to the message for uniqueness
	 *
	 * @returns Promise resolving to signature bytes or null if signing fails
	 *
	 * @example
	 * ```typescript
	 * // Using input_keys ["amount", "recipient"] must match initialize input_keys
	 * const signature = await sdk.constructSignature({
	 *   sendersAddress: "0x123...",
	 *   capType: "0xabc::nft::MintCap",
	 *   protocolType: "0xabc::nft::Collection",
	 *   options: {
	 *     message: ["1000", "0x456..."], // amount, recipient
	 *     salt: "unique-nonce-123"
	 *   }
	 * });
	 *
	 * // Without message and salt must match initialize input_keys
	 * const signature = await sdk.constructSignature({
	 *   sendersAddress: "0x123...",
	 *   capType: "0xabc::nft::MintCap",
	 *   protocolType: "0xabc::nft::Collection",
	 *   signatureUrl: "https://your-signing-service.com/sign"
	 * });
	 * ```
	 */
	async constructSignature({
		sendersAddress,
		capType,
		protocolType,
		signatureUrl,
		options,
	}: ConstructSignatureParams): Promise<Uint8Array | null> {
		const concatMsg = options?.message ? options.message.join(",") : "";
		const msg = `${sendersAddress},${capType},${protocolType},${concatMsg}${options?.salt ? "," + options.salt : ""}`;
		if (!this.privateKey && signatureUrl) {
			const fullSignature: string = await axios.post(signatureUrl, {
				message: new TextEncoder().encode(msg),
			});

			return fromBase64(fullSignature);
		} else if (this.privateKey) {
			const fullSignature = this.privateKey.signPersonalMessage(
				new TextEncoder().encode(msg),
			);
			return fromBase64((await fullSignature).signature);
		}
		return null;
	}

	/**
	 * Borrow a capability from the holder using the authentication object.
	 *
	 * This function uses Sui's borrow checker pattern to safely lend the capability
	 * for operations while ensuring it must be returned.
	 *
	 * @param params - Borrow parameters
	 * @param params.holderCap - The holder capability wrapper object
	 * @param params.authentication - Authentication object from signin function
	 * @param params.capType - The capability type (e.g., "0xabc::nft::MintCap")
	 * @param params.tx - Transaction object to append the move call
	 *
	 * @returns Promise resolving to transaction, borrowed capability, and borrow receipt
	 *
	 * @example
	 * ```typescript
	 * const { transaction, cap, borrowPotato } = await sdk.borrowCap({
	 *   holderCap: "0x123...",
	 *   authentication: authObject,
	 *   capType: "0xabc::nft::MintCap",
	 *   tx: transaction
	 * });
	 *
	 * // Use the borrowed capability
	 * transaction.moveCall({
	 *   target: `${packageId}::nft::mint`,
	 *   arguments: [cap, tx.pure.string("NFT Name")]
	 * });
	 *
	 * // Must return the capability later
	 * await sdk.returnCap({
	 *   cap,
	 *   borrowPotato,
	 *   holderCap: "0x123...",
	 *   capType: "0xabc::nft::MintCap",
	 *   tx: transaction
	 * });
	 * ```
	 */
	async borrowCap({
		holderCap,
		authentication,
		capType,
		tx,
	}: BorrowCapParams): Promise<{
		transaction: Transaction;
		cap: any;
		borrowPotato: any;
	}> {
		const [cap, borrowPotato] = tx.moveCall({
			target: `${packageId}::authentication::take_key`,
			arguments: [
				tx.object(holderCap as any),
				tx.object(authentication as any),
			],
			typeArguments: [capType],
		});
		return {
			transaction: tx,
			cap,
			borrowPotato,
		};
	}

	/**
	 * Return a borrowed capability to the holder.
	 *
	 * This function completes the borrow cycle by returning the capability
	 * along with the borrow receipt to ensure the borrow was legitimate.
	 *
	 * @param params - Return parameters
	 * @param params.tx - Transaction object to append the move call
	 * @param params.cap - The borrowed capability object to return
	 * @param params.capType - The capability type (e.g., "0xabc::nft::MintCap")
	 * @param params.holderCap - The holder capability wrapper object
	 * @param params.borrowPotato - The borrow receipt from borrowCap function
	 *
	 * @returns Promise resolving to the updated transaction
	 *
	 * @example
	 * ```typescript
	 * // After using the borrowed capability
	 * await sdk.returnCap({
	 *   tx: transaction,
	 *   cap: borrowedCap,
	 *   capType: "0xabc::nft::MintCap",
	 *   holderCap: "0x123...",
	 *   borrowPotato: borrowReceipt
	 * });
	 * ```
	 */
	async returnCap({
		tx,
		cap,
		capType,
		holderCap,
		borrowPotato,
	}: ReturnCapParams): Promise<Transaction> {
		tx.moveCall({
			target: `${packageId}::authentication::return_key`,
			arguments: [
				tx.object(holderCap as any),
				tx.object(cap as any),
				tx.object(borrowPotato as any),
			],
			typeArguments: [capType],
		});

		return tx;
	}

	/**
	 * Withdraw (destroy) the capability holder and protocol wrapper.
	 *
	 * This permanently destroys the authentication system and returns the
	 * original capability to the owner. This action cannot be undone and
	 * can only be called by the address that originally initialized the
	 * capability wrapper.
	 *
	 * @param params - Withdrawal parameters
	 * @param params.tx - Transaction object to append the move call
	 * @param params.capType - The capability type (e.g., "0xabc::nft::MintCap")
	 * @param params.holderCap - The holder capability wrapper to destroy
	 * @param params.protocolWrapper - The protocol wrapper containing configuration
	 *
	 * @returns Promise resolving to the updated transaction
	 *
	 * @example
	 * ```typescript
	 * // Only the original initializer can destroy the authentication system
	 * await sdk.withdrawCap({
	 *   tx: transaction,
	 *   capType: "0xabc::nft::MintCap",
	 *   holderCap: "0x123...",
	 *   protocolWrapper: "0x456..."
	 * });
	 *
	 * // The original capability will be returned to the initializer
	 * ```
	 *
	 * @note Only the address that called `initialize` can execute this function
	 * @warning This action is permanent and cannot be undone
	 */
	async withdrawCap({
		tx,
		capType,
		holderCap,
		protocolWrapper,
	}: WithdrawCapParams): Promise<Transaction> {
		tx.moveCall({
			target: `${packageId}::authentication::destroy`,
			arguments: [tx.object(holderCap as any), tx.object(protocolWrapper)],
			typeArguments: [capType],
		});
		return tx;
	}

	/**
	 * Convert bytes to hex string for smart contract testing.
	 *
	 * Use this function together with constructSignature to get a hex representation
	 * similar to what is tested in the auth_bridge smart contract.
	 *
	 * @param bytes - The byte array to convert
	 * @returns The hex string representation of the byte array
	 *
	 * @example
	 * ```typescript
	 * const signature = await sdk.constructSignature({...});
	 * const hexSignature = sdk.convertBytesToHex(signature);
	 * console.log("Hex signature:", hexSignature);
	 * ```
	 */
	convertBytesToHex(bytes: Uint8Array): string {
		return Array.from(bytes)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
	}

	private addHexPrefixes(data: string): string {
		// Add 0x at the start if not present
		if (!data.startsWith("0x")) {
			data = "0x" + data;
			// Add 0x after <, comma, or comma+space when followed by 40 hex characters
			data = data.replace(/(<\s*|,\s*)([a-f0-9]{40})/g, "$10x$2");
		}

		return data;
	}

	private fixType(type: string): string {
		if (type.startsWith("<")) type = type.slice(1, -1);
		type = this.addHexPrefixes(type);
		return type;
	}

	private appendZeros(value: string): string {
		const parts = value.split("::", 2);
		let addressPart = parts[0];
		const restOfString =
			parts.length > 1 ? "::" + parts.slice(1).join("::") : "";

		let numericPart = addressPart;
		if (!numericPart) return value;
		if (numericPart.startsWith("0x")) {
			numericPart = numericPart.substring(2);
		}

		// Remove leading zeros to get the canonical number
		const canonicalNumericPart = numericPart.replace(/^0+/, "");

		if (canonicalNumericPart === "1" || canonicalNumericPart === "2") {
			const targetNumericLength = 32; // For 32 hex characters
			const paddedNumericPart =
				"0".repeat(targetNumericLength - canonicalNumericPart.length) +
				canonicalNumericPart;
			addressPart = "0x" + paddedNumericPart;
			value = addressPart + restOfString;
		}
		return value;
	}
}
