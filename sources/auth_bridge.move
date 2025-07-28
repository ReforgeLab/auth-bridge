/// Module: mintcap
module auth_bridge::authentication {
    use auth_bridge::{errors, utils};
    use std::string::String;
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
        _: &Protocol<P>,
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
    public fun signin<T: key + store, P>(
        amount: u8,
        full_sig: vector<u8>,
        salt: String,
        protocol: &Protocol<P>,
        // cap: &mut Cap<T>,
        ctx: &mut TxContext,
    ): Authentication<T> {
        let sender = ctx.sender();
        let mut msg: vector<u8> = vector::empty();
        msg.append(sender.to_string().into_bytes());

        let (raw_sign, raw_public_key) = utils::extract_signature_and_pubilc_key(full_sig);

        assert!(
            protocol.address == utils::derive_address_from_ed25519(raw_public_key),
            errors::protocolAddrassNotMatch!(),
        );
        let mut msg = b"0x".to_string();
        msg.append(sender.to_string());
        msg.append(amount.to_string());
        msg.append(utils::type_to_string<T>());
        msg.append(salt);

        let message = utils::prepare_message(msg.into_bytes());

        assert!(
            ed25519_verify(&raw_sign, &raw_public_key, &message),
            errors::notEd25519Signature!(),
        );
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
        let message = b"Hello Carl";

        std::debug::print(&b"message Bytes:".to_string());
        std::debug::print(&message);
        let msg = x"48656c6c6f204361726c";
        assert!(message == msg, 100);
    }

    #[test]
    fun test_more_complex_msg() {
        let senderAddress = @0xacd8e7b8e4e500be3c528c54a7f717df00497d68f959fd3dc83c2d043a9b98bc;
        let mut msg = b"0x".to_string();
        msg.append(senderAddress.to_string());
        std::debug::print(&b"senderAddress:".to_string());
        std::debug::print(&msg);
        msg.append(b"8".to_string());
        msg.append(b"0x123::type::typename".to_string());
        std::debug::print(&b"message Bytes:".to_string());
        std::debug::print(&msg);
        let expected_msg_string = b"0xacd8e7b8e4e500be3c528c54a7f717df00497d68f959fd3dc83c2d043a9b98bc80x123::type::typename".to_string();
        assert!(msg == expected_msg_string, 101);
        let expected_msg =
            x"3078616364386537623865346535303062653363353238633534613766373137646630303439376436386639353966643364633833633264303433613962393862633830783132333a3a747970653a3a747970656e616d65";
        assert!(msg.as_bytes() == expected_msg, 102);
    }

    #[test_only]
    const Alice: address = @0xacd8e7b8e4e500be3c528c54a7f717df00497d68f959fd3dc83c2d043a9b98bc;
    #[test]
    fun test_signin() {
        use sui::coin::Coin;
        use sui::kiosk::Kiosk;
        use sui::sui::SUI;
        use sui::test_utils::destroy;
        let mut scen = sui::test_scenario::begin(Alice);
        let salt = b"ron102".to_string();
        let amount = 8;
        let full_sig =
            x"00392b4f0f873efc04f01e8f2ffc8cc72e9109823dc09442e5fbfbe833876274dfff8210e6485b85b4d8cba6a7a8471972878f7e0013835f2d792f8d1b14459d0dbb5c5740e424d5bfe544dd13ecc98dcb2fe4ea5639c1ff017dbe31eeffcc9146";

        let protocol = Protocol<Kiosk> {
            id: object::new(scen.ctx()),
            address: @0xb4c77849994ac68b46d0ad015acae9ea5b6bfe6ad040815f0612bb986036bf3a,
        };
        let auth = signin<Coin<SUI>, Kiosk>(amount, full_sig, salt, &protocol, scen.ctx());
        destroy(protocol);
        destroy(auth);
        scen.end();
    }
}
