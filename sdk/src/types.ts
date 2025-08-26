import type { Transaction } from "@mysten/sui/transactions";

/**
 * Parameters for initializing an authentication protocol
 */
export interface InitializeParams {
	/** The capability object to be stored securely */
	key: string;
	/** Address of the centralized signing service */
	centralizedAddress: string;
	/** Keys used to construct the signing message (sender and type added automatically) */
	input_keys: string[];
	/** Keys returned after successful authentication */
	output_keys: string[];
	/** The protocol object (e.g., NFT collection) */
	protocol: string;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** The protocol type (e.g., "0xabc::nft::Collection") */
	protocolType: string;
	/** Transaction object to append the move call */
	tx: Transaction;
}

/**
 * Parameters for signing in to the authentication protocol
 */
export interface SigninParams {
	/** The protocol wrapper object containing configuration */
	protocolWrapper: string;
	/** The holder capability wrapper object */
	holderCap: string;
	/** The full signature from constructSignature function */
	fullSignature: Uint8Array;
	/** Key/value pairs for message verification (must match input_keys) */
	data: Map<string, string>;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** The protocol type (e.g., "0xabc::nft::Collection") */
	protocolType: string;
	/** Transaction object to append the move call */
	tx: Transaction;
}

/**
 * Parameters for constructing a signature for authentication
 */
export interface ConstructSignatureParams {
	/** Address of the sender who will call the signin function */
	sendersAddress: string;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** The protocol type (e.g., "0xabc::nft::Collection") */
	protocolType: string;
	/** Optional URL to a signing service (if no private key in constructor) */
	signatureUrl?: string;
	/** Additional signing options */
	options?: {
		/** Salt to add to the message for uniqueness */
		salt?: string;
		/** Additional message parts (e.g., allowed actions, nonce) */
		message?: string[];
	};
}

/**
 * Parameters for borrowing a capability
 */
export interface BorrowCapParams {
	/** The holder capability wrapper object */
	holderCap: string;
	/** Authentication object from signin function */
	authentication: string;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** Transaction object to append the move call */
	tx: Transaction;
}

/**
 * Parameters for returning a borrowed capability
 */
export interface ReturnCapParams {
	/** The holder capability wrapper object */
	holderCap: string;
	/** The borrowed capability object to return */
	cap: any;
	/** The borrow receipt from borrowCap function */
	borrowPotato: any;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** Transaction object to append the move call */
	tx: Transaction;
}

/**
 * Parameters for withdrawing (destroying) the capability holder
 */
export interface WithdrawCapParams {
	/** The holder capability wrapper to destroy */
	holderCap: string;
	/** The protocol wrapper containing configuration */
	protocolWrapper: string;
	/** The capability type (e.g., "0xabc::nft::MintCap") */
	capType: string;
	/** Transaction object to append the move call */
	tx: Transaction;
}

// export interface StoreCapParams {
//
// }
