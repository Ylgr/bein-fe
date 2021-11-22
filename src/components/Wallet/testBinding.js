const API = require("@polkadot/api")
const Web3 = require("web3")
const web3 = new Web3()
// const cloverTypes = require('@clover-network/node-types')

const PUB_KEY = "0xb4faF11047d05B4e2a2362B6D7529010e0D30aE4"
const PRIV_KEY = "0x247abd2d66b03303d327b0382ba3a0f04b931a28e0e08d1747e37426b0aa9a8e"
const CLOVER_SEEDS = "your 12 seed words"

async function run() {
    const wsProvider = new API.WsProvider('ws://127.0.0.1:9944');
    const api = await API.ApiPromise.create({
        provider: wsProvider
        // types: cloverTypes
    });
    const keyring = new API.Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri("//Dave");
    let nonce = await api.rpc.system.accountNextIndex(alice.address);
    web3.eth.accounts.wallet.add(PRIV_KEY);
    let signature = await web3.eth.sign(`bein evm:${web3.utils.bytesToHex(alice.publicKey).slice(2)}`, PUB_KEY);

    await api.tx.evmAccounts
        .claimAccount(PUB_KEY, web3.utils.hexToBytes(signature))
        .signAndSend(alice, {
            nonce,
        }, ({ events = [], status }) => {
            if (status.isFinalized) {
                console.log(`${alice.address} has bound with EVM address: ${PUB_KEY}`)
            }
        });
}

run()