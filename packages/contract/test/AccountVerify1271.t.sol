// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "forge-std/console2.sol";
import "../src/DaimoAccountFactory.sol";
import "../src/DaimoAccount.sol";
import "./Utils.sol";

import "account-abstraction/core/EntryPoint.sol";

contract AccountVerify1271Test is Test {
    using UserOperationLib for UserOperation;

    EntryPoint public entryPoint;
    DaimoVerifier public verifier;
    DaimoAccountFactory public factory;
    DaimoAccount public account;

    function setUp() public {
        entryPoint = new EntryPoint();
        verifier = new DaimoVerifier();
        factory = new DaimoAccountFactory(entryPoint, verifier);

        // Create test account with a single signing key
        uint256[2] memory pubKey = [
            0x65a2fa44daad46eab0278703edb6c4dcf5e30b8a9aec09fdc71a56f52aa392e4,
            0x4a7a9e4604aa36898209997288e902ac544a555e4b5e0a9efef2b59233f3f437
        ];
        bytes32[2] memory key = [bytes32(pubKey[0]), bytes32(pubKey[1])];
        account = factory.createAccount(0, key, new DaimoAccount.Call[](0), 0);

        console.log("entryPoint address:", address(entryPoint));
        console.log("factory address:", address(factory));
        console.log("account address:", address(account));
    }

    function testVerifySig() public {
        // Non-malleable signature. s is <= n/2
        bytes memory sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: 0x2adcff2bd06fc3cdd03e21e5e4c197913e96e75cad0bc6e9c9c14607af4f3a37
                })
            )
        );

        // check a valid signature
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE

        // check an invalid signature
        hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec6;
        ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));
    }

    function testSignatureMalleability() public {
        // Malleable signature. s is > n/2
        uint256 s = 0xd52300d32f903c332fc1de1a1b3e686e7e501350fa0bd79b29f884bb4d13eb1a;
        bytes memory sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: s
                })
            )
        );

        // Malleable signature is NOT accepted
        bytes32 hash = 0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5;
        bytes4 ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0xffffffff));

        // Fix the signature by changing s
        uint256 n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551;
        s = n - s;
        sig = abi.encodePacked(
            uint8(0), // keySlot
            abi.encode( // signature
                Utils.rawSignatureToSignature({
                    challenge: abi.encodePacked(
                        bytes32(
                            0x15fa6f8c855db1dccbb8a42eef3a7b83f11d29758e84aed37312527165d5eec5
                        )
                    ),
                    r: 0x3f033e5c93d0310f33632295f64d526f7569c4cb30895f50d60de5fe9e0e6a9a,
                    s: s
                })
            )
        );
        console.log("fixed sig s:", s);

        // Now it's accepted
        ret = account.isValidSignature(hash, sig);
        assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE
    }

    // TODO
    // function testWebauthnSignature() public {
    //     uint256[2] memory publicKey = [
    //         0x80d9326e49eb6314d03f58830369ea5bafbc4e2709b30bff1f4379586ca869d9,
    //         0x806ed746d8ac6c2779a472d8c1ed4c200b07978d9d8d8d862be8b7d4b7fb6350
    //     ];
    //     bytes32[2] memory key = [bytes32(publicKey[0]), bytes32(publicKey[1])];
    //     vm.startPrank(address(account));
    //     account.addSigningKey(1, key);
    //     vm.stopPrank();

    //     string
    //         memory clientDataJSON = '{"type":"webauthn.get","challenge":"dGVzdA","origin":"https://funny-froyo-3f9b75.netlify.app"}';
    //     bytes memory challenge = hex"74657374";
    //     bytes
    //         memory authenticatorData = hex"e0b592a7dd54eedeec65206e031fc196b8e5915f9b389735860c83854f65dc0e1d00000000";
    //     uint256 r = 0x32e005a53ae49a96ac88c715243638dd5c985fbd463c727d8eefd05bee4e2570;
    //     uint256 s = 0x7a4fef4d0b11187f95f69eefbb428df8ac799bbd9305066b1e9c9fe9a5bcf8c4;
    //     uint256 challengeLocation = 23;
    //     uint256 responseTypeLocation = 1;

    //     bytes memory sig = abi.encodePacked(
    //         uint8(1), // keySlot
    //         uint8(1), // signatureType
    //         abi.encode(
    //             DaimoAccount.WebAuthnSignature({
    //                 authenticatorData: authenticatorData,
    //                 clientDataJSON: clientDataJSON,
    //                 challengeLocation: challengeLocation,
    //                 responseTypeLocation: responseTypeLocation,
    //                 r: r,
    //                 s: s
    //             })
    //         ) // signature
    //     );

    //     bytes4 ret = account.isValidSignature(bytes32(challenge), sig);
    //     assertEq(ret, bytes4(0x1626ba7e)); // ERC1271_MAGICVALUE
    // }
}
