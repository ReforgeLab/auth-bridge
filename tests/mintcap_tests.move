#[test_only]
module mintcap::mintcap_tests {
    use mintcap::authentication;
    use sui::test_scenario::{Self, Scenario};

    const SENDER: address = @0xb4c77849994ac68b46d0ad015acae9ea5b6bfe6ad040815f0612bb986036bf3a;

    public struct TestType {}

    #[test]
    fun test_mintcap() {
        let mut scen = test_scenario::begin(SENDER);
        let amount = 3;
        let mut salt = vector::empty<u8>();
        salt.append(b"123");
        let mut signature = vector::empty<u8>();
        signature.append(b"signature");
        authentication::login<TestType>(amount, signature, salt, scen.ctx());
        scen.end();
    }
}
