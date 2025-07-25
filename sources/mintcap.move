/// Module: mintcap
module mintcap::authentication {
    use mintcap::utils;
    use sui::{borrow::{Self, Borrow, Referent}, dynamic_field, ed25519::ed25519_verify};

    public struct Cap<T: key + store> has key, store {
        id: UID,
        cap: Referent<T>,
        owner: address,
    }
    public struct Protocol<phantom T> has key, store {
        id: UID,
        address: address,
    }

    // public struct Authentication<phantom T: key + store> has drop {
    public struct Authentication<phantom T> has drop {
        initiater: address,
        amount: u8,
    }

    /// @notice: Make sure this otw is from a module that is not important for your protocol
    /// @param otw: One Time Witness, a module that is not important for your protocol
    /// @param address: The pubilc address that is the centralized addross that signs the messages
    /// @notice: Shares the Protocol object
    public fun new<P: drop>(otw: P, address: address, ctx: &mut TxContext) {
        sui::types::is_one_time_witness(&otw);

        transfer::share_object(Protocol<P> {
            id: sui::object::new(ctx),
            address,
        })
    }

    public fun create_and_store_cap<T: key + store, P: key + store>(
        cap: T,
        _: Protocol<P>,
        ctx: &mut TxContext,
    ) {
        let owner = ctx.sender();
        let uid = sui::object::new(ctx);
        let mint_cap = Cap<T> {
            id: uid,
            cap: borrow::new(cap, ctx),
            owner,
        };

        transfer::share_object(mint_cap);
    }

    // public fun login<T: key + store>(
    public fun signin<T>(
        amount: u8,
        full_sig: vector<u8>,
        // salt: vector<u8>,
        // cap: &mut Cap<T>,
        ctx: &mut TxContext,
    ): Authentication<T> {
        let sender = ctx.sender();
        let mut msg: vector<u8> = vector::empty();
        msg.append(sender.to_string().into_bytes());

        // assert!(ed25519_verify(&signature, &centr, &msg), 101);
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

    #[test]
    fun test_sign() {
        print(&b"centrt address: ".to_string());
        print(&CENTRALIZED_ADDRESS);
        let add = derive_address_from_ed25519(CENTRALIZED_ADDRESS);
        print(&b"address: ".to_string());
        print(&add);

        // let hexAddr = add.to_bytes();
        // let hexAddr = sui::hex::encode(add.to_bytes());
        let hexAddr = std::bcs::to_bytes(add.to_string().as_bytes());
        print(&b"hexAddr: ".to_string());
        print(&hexAddr);
    }
}
