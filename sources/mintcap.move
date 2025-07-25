/// Module: mintcap
module mintcap::authentication {
    use std::{string::{Self, String}, type_name::get_with_original_ids};
    use sui::{borrow::{Self, Borrow, Referent}, dynamic_field, ed25519::ed25519_verify};

    const CENTRALIZED_ADDRESS: vector<u8> = vector[
        187, 92, 87, 64, 228, 36, 213, 191, 229, 68, 221, 19, 236, 201, 141, 203, 47, 228, 234, 86,
        57, 193, 255, 1, 125, 190, 49, 238, 255, 204, 145, 70,
    ];

    // const CENTRALIZED_ADDRESS: address =
    //     @0xb4c77849994ac68b46d0ad015acae9ea5b6bfe6ad040815f0612bb986036bf3a;

    public struct Cap<T: key + store> has key, store {
        id: UID,
        cap: Referent<T>,
        owner: address,
    }

    // public struct Authentication<phantom T: key + store> has drop {
    public struct Authentication<phantom T> has drop {
        initiater: address,
        amount: u8,
    }

    public fun new<T: key + store>(cap: T, ctx: &mut TxContext) {
        let owner = ctx.sender();
        let uid = sui::object::new(ctx);
        let mint_cap = Cap<T> {
            id: uid,
            cap: borrow::new(cap, ctx),
            owner,
        };
        transfer::share_object(mint_cap);
    }

    public fun sign(full_sig: vector<u8>, message: vector<u8>, ctx: &TxContext) {
        assert!(ed25519_verify(&full_sig, &CENTRALIZED_ADDRESS, &message), 101);
    }

    // public fun login<T: key + store>(
    public fun login<T>(
        amount: u8,
        // signature: String,
        signature: vector<u8>,
        // salt: vector<u8>,
        // cap: &mut Cap<T>,
        ctx: &mut TxContext,
    ): Authentication<T> {
        let sender = ctx.sender();
        let mut msg: vector<u8> = vector::empty();
        // let withoutzero = b"b4c77849994ac68b46d0ad015acae9ea5b6bfe6ad040815f0612bb986036bf3a";
        // std::debug::print(&withoutzero);
        // msg.append(CENTRALIZED_ADDRESS.to_string().into_bytes());
        // std::debug::print(&CENTRALIZED_ADDRESS.to_string().into_bytes());
        msg.append(sender.to_string().into_bytes());
        // msg.append(type_to_string<T>().into_bytes());
        // msg.append(salt);
        // msg.push_back(amount);
        // std::debug::print(&msg);
        let centr = CENTRALIZED_ADDRESS;

        assert!(ed25519_verify(&signature, &centr, &msg), 101);
        // dynamic_field::add(&mut cap.id, signature, true);

        Authentication<T> {
            initiater: sender,
            amount,
        }
    }

    public fun destroy<T: key + store>(self: Cap<T>, ctx: &mut TxContext) {
        let sender = ctx.sender();
        assert!(self.owner == sender, 102);
        let Cap {
            id,
            cap,
            ..,
        } = self;
        let cap = borrow::destroy(cap);

        transfer::public_transfer(cap, sender);
        id.delete();
    }

    public fun take_key<T: key + store>(self: &mut Cap<T>, _: Authentication<T>): (T, Borrow) {
        self.cap.borrow()
    }

    public fun return_key<T: key + store>(self: &mut Cap<T>, value: T, borrow: Borrow) {
        self.cap.put_back(value, borrow);
    }

    // Helper function
    fun type_to_string<T>(): String {
        string::from_ascii(get_with_original_ids<T>().into_string())
    }
}
