/// Module: mintcap
module auth_bridge::authentication {
    use auth_bridge::{errors, utils};
    use std::string::String;
    use sui::{
        borrow::{Self, Borrow, Referent},
        dynamic_field,
        ed25519::ed25519_verify,
        vec_map::{Self, VecMap}
    };

    public struct Config has store {
        address: address,
        input: VecMap<String, String>,
        output: VecMap<String, String>,
    }

    public struct Cap<T: key + store> has key, store {
        id: UID,
        cap: Referent<T>,
        owner: address,
    }

    public struct Protocol<phantom T> has key, store {
        id: UID,
        config: Config,
    }

    public struct Authentication<phantom T> has drop {
        initiater: address,
        output: VecMap<String, String>,
    }

    /// @notice: Make sure this otw is from a module that is not important for your protocol
    /// @param otw: One Time Witness, a module that is not important for your protocol
    /// @param address: The pubilc address that is the centralized addross that signs the messages
    /// @notice: Shares the Protocol object
    public fun new<P: drop>(
        otw: P,
        address: address,
        input_keys: vector<String>,
        output_keys: vector<String>,
        ctx: &mut TxContext,
    ) {
        sui::types::is_one_time_witness(&otw);

        let input = input_keys.fold!<String, VecMap<String, String>>(
            vec_map::empty<String, String>(),
            |mut acc, v| {
                acc.insert(v, b"".to_string());
                acc
            },
        );

        let output = output_keys.fold!<String, VecMap<String, String>>(
            vec_map::empty<String, String>(),
            |mut acc, v| {
                acc.insert(v, b"".to_string());
                acc
            },
        );

        let config = Config {
            address,
            input,
            output,
        };

        transfer::share_object(Protocol<P> {
            id: sui::object::new(ctx),
            config,
        })
    }

    public fun create_and_store_cap<T: key + store, P>(
        _: &Protocol<P>,
        cap: T,
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

    public fun signin<T: key + store, P>(
        protocol: &Protocol<P>,
        cap: &mut Cap<T>,
        full_sig: vector<u8>,
        data: VecMap<String, String>,
        ctx: &mut TxContext,
    ): Authentication<T> {
        let sender = ctx.sender();

        let (raw_sign, raw_public_key) = utils::extract_signature_and_pubilc_key(full_sig);
        let protocol_keys = protocol.config.input.keys();

        assert!(
            protocol.config.address == utils::derive_address_from_ed25519(raw_public_key),
            errors::protocolAddrassNotMatch!(),
        );
        // use a loop to append the string. Create a vector of strings in argument.
        // Check with the config and loop them thrue so the order is correct
        // let mut msg = b"0x".to_string();
        let mut output = vec_map::empty<String, String>();
        let msg: String = protocol_keys.fold!(b"0x".to_string(), |mut acc, v| {
            let value = *data.get(&v);
            if (v == b"sender".to_string()) {
                acc.append(ctx.sender().to_string())
            } else { acc.append(value); };
            if (protocol.config.output.contains(&v)) {
                output.insert(v, value)
            };

            acc
        });
        std::debug::print(&b"Message: ".to_string());
        std::debug::print(&msg);

        let message = utils::hash_message(msg.into_bytes());

        assert!(
            ed25519_verify(&raw_sign, &raw_public_key, &message),
            errors::notEd25519Signature!(),
        );
        dynamic_field::add(&mut cap.id, raw_public_key, true);
        Authentication<T> {
            initiater: sender,
            output,
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
}
