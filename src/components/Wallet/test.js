// Import
const { ApiPromise, WsProvider } = require('@polkadot/api');
const cloverTypes = require('@clover-network/node-types')

async function main() {
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    // const data = await api.query.evmAccounts.evmAddresses('5DAAnrj7VxTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy')
    // console.log(data.toString())
    const unsub = await api.query.system.account('5HomA4Yt1GNqmD3Zr7okYhb5PFTpCBrgghQMGWjSVEeYL9Gi', ({ nonce, data: balance }) => {
        console.log(`free balance is ${balance.free} with ${balance.reserved} reserved and a nonce of ${nonce}`);
    });
}


main().catch(err => console.log(err))