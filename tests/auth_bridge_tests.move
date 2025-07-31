#[test_only]
module auth_bridge::auth_tests {
    use auth_bridge::{authentication::{Self, Cap, Protocol}, utils};
    use std::debug::print;
    use sui::{test_scenario::{Self, Scenario}, test_utils::destroy, vec_map::{Self, VecMap}};

    const SENDER: address = @0xb4c77849994ac68b46d0ad015acae9ea5b6bfe6ad040815f0612bb986036bf3a;
    const Alice: address = @0xacd8e7b8e4e500be3c528c54a7f717df00497d68f959fd3dc83c2d043a9b98bc;

    public struct TestKey has key, store {
        id: UID,
    }
    public struct AUTH_TESTS has drop {}

    #[test, expected_failure(abort_code = 0)]
    fun revert_signin_with_same_message() {
        let (mut scen, protocol, mut cap) = setup();

        let full_sig =
            x"009afa406c6e2bd9b735ec4d7a66ef3dc41d2411cdb1bb9d0cabb8dfd9addb4dce7cefb43f99739fbddbe84a0bcb5d379b341eb81f213e62d8d41b7f9e45e82d02bb5c5740e424d5bfe544dd13ecc98dcb2fe4ea5639c1ff017dbe31eeffcc9146";

        let keys = vector[
            b"sender".to_string(),
            b"amount".to_string(),
            b"type".to_string(),
            b"salt".to_string(),
        ];
        let values = vector[
            b"".to_string(),
            b"8".to_string(),
            b"".to_string(),
            b"ron102".to_string(),
        ];
        let input_keys = vec_map::from_keys_values(keys, values);

        scen.next_tx(Alice);
        authentication::signin<TestKey, AUTH_TESTS>(
            &protocol,
            &mut cap,
            full_sig,
            input_keys,
            scen.ctx(),
        );
        scen.next_tx(Alice);
        authentication::signin<TestKey, AUTH_TESTS>(
            &protocol,
            &mut cap,
            full_sig,
            input_keys,
            scen.ctx(),
        );
        abort
    }

    #[test]
    fun destroy_wrapper() {
        let (mut scen, protocol, cap) = setup();
        cap.destroy(protocol, scen.ctx());
        scen.end();
    }

    #[test]
    fun signin() {
        let (mut scen, protocol, mut cap) = setup();
        let full_sig =
            x"009afa406c6e2bd9b735ec4d7a66ef3dc41d2411cdb1bb9d0cabb8dfd9addb4dce7cefb43f99739fbddbe84a0bcb5d379b341eb81f213e62d8d41b7f9e45e82d02bb5c5740e424d5bfe544dd13ecc98dcb2fe4ea5639c1ff017dbe31eeffcc9146";
        let keys = vector[
            b"sender".to_string(),
            b"amount".to_string(),
            b"type".to_string(),
            b"salt".to_string(),
        ];
        let values = vector[
            b"".to_string(),
            b"8".to_string(),
            b"".to_string(),
            b"ron102".to_string(),
        ];
        let input_keys = vec_map::from_keys_values(keys, values);

        scen.next_tx(Alice);
        let auth = authentication::signin<TestKey, AUTH_TESTS>(
            &protocol,
            &mut cap,
            full_sig,
            input_keys,
            scen.ctx(),
        );
        destroy(protocol);
        destroy(cap);
        destroy(auth);
        scen.end();
    }

    fun setup(): (Scenario, Protocol<AUTH_TESTS>, Cap<TestKey>) {
        let mut scen = sui::test_scenario::begin(Alice);

        let otw = AUTH_TESTS {};
        let key = TestKey {
            id: object::new(scen.ctx()),
        };
        let keys = vector[
            b"sender".to_string(),
            b"amount".to_string(),
            b"type".to_string(),
            b"salt".to_string(),
        ];
        authentication::new(otw, SENDER, keys, vector[b"amount".to_string()], scen.ctx());
        scen.next_tx(SENDER);
        let protocol = scen.take_shared<Protocol<AUTH_TESTS>>();
        protocol.create_and_store_cap(key, scen.ctx());
        scen.next_tx(SENDER);
        let cap = scen.take_shared<Cap<TestKey>>();

        (scen, protocol, cap)
    }
}
