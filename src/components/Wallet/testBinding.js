const API = require("@polkadot/api")
const Web3 = require("web3")
const web3 = new Web3()
const { decodeAddress } = require('@polkadot/util-crypto');
const PUB_KEY = "0x6A5e1016064E6f72fFf7F5bAE96BC1d7a5269b1b"
const PRIV_KEY = "6b873ffd28afb634af105efda9856635b93a147404ae5b71719c5cc7dc09ed79"
const CLOVER_SEEDS = "your 12 seed words"

async function run() {
    const wsProvider = new API.WsProvider('ws://127.0.0.1:9944');
    const api = await API.ApiPromise.create({
        provider: wsProvider,
        // types: cloverTypes
    });
    const keyring = new API.Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri("//Alice");
    // let nonce = await api.rpc.system.accountNextIndex(alice.address);
    // const publicKey = '5H1bphA85GrUxix56jVZ9fWQ6dKoSnp4S9583s7bGhtSnCEi'
    // web3.eth.accounts.wallet.add(PRIV_KEY);
    let signature = await web3.eth.sign(`bein evm:${web3.utils.bytesToHex(publicKey).slice(2)}`, PUB_KEY);
    // console.log(signature);
    // await api.tx.evmAccounts
    //     .claimAccount(PUB_KEY, web3.utils.hexToBytes(signature))
    //     .signAndSend(alice, {
    //         nonce,
    //     }, ({ events = [], status }) => {
    //         if (status.isFinalized) {
    //             console.log(`${alice.address} has bound with EVM address: ${PUB_KEY}`)
    //         }
    //     });
    console.log( decodeAddress('5DSaSznmKRjt9Lvg4478V54UU8kdNyZKSQM8brSiczFR1S1H'))
    console.log(web3.utils.bytesToHex(alice.publicKey), alice.address)
}

run()