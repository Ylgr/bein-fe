/* eslint-disable */
import React, { Component, useEffect, useState } from "react";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import {Link} from "@material-ui/core";
import CreateTokenPlugin from "components/Plugin/CreateTokenPlugin";
import PluginType from "components/Plugin/PluginType";
import GridItem from "components/Grid/GridItem";
import Button from "components/CustomButtons/Button.js";
import Web3 from "web3";
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

export default function Wallet(props) {
    const [web3, setWeb3] = useState(null);
    const [provider, setProvider] = useState('ws://127.0.0.1:9944');
    const [api, setAPI] = useState(null);
    const [bindedEvmAddr, setBindedEvmAddr] = useState(null);
    const [connectedEvmAddr, setConnectEvmAddr] = useState(null);
    const [ss58Addr, setSS58Addr] = useState(null);
    const [balance, setBalance] = useState(null);

    const connectMetamask = async () => {
        if (!!window.ethereum) {
            const web3 = new Web3(window.ethereum);
            await window.ethereum.request({ method: "eth_requestAccounts" })
            setWeb3(web3);
            const addresses = await web3.eth.getAccounts();
            setConnectEvmAddr(addresses[0]);
        
            window.ethereum.on('accountsChanged', (addresses) => {
                setConnectEvmAddr(addresses[0])
            });
        } else {
            alert('Cannot detect metamask wallet');
        }
    }

    const connectPolkadotWallet = async () => {
        const extension = await web3Enable('Polkadot Hackathon');
        if (extension.length === 0) {
            alert('Connect detect polkadot wallet');
            return;
        }
        const allAccounts = await web3Accounts();
        if (allAccounts.length === 0) {
            alert('Please create an account and try again');
            return;
        }
        setSS58Addr(allAccounts[0].address);

        const wsProvider = new WsProvider(provider);
        const api = await ApiPromise.create({ provider: wsProvider });
        setAPI(api);
        try {
            const evmAddr = (await api.query.evmAccounts.evmAddresses(ss58Addr)).toString()
            if (evmAddr !== '') {
                setBindedEvmAddr(evmAddr)
            }
        } catch(err) {
            console.log(err)
        }
    }

    const getBalance = async () => {
        if (!api) {
            return false;
        }
        const unsub = await api.query.system.account(ss58Addr, ({ nonce, data: balance }) => {
            const free = `${balance.free}`;
            setBalance(free);
        });
        return true;
    }

    const bindingEVMAddress = async () => {
        if (!!bindedEvmAddr) {
            alert('EVM address already binded');
            return;
        }
        if (!ss58Addr || !connectedEvmAddr) {
            alert('Need connecting to 2 wallets');
            return;
        }
        if (!api) {
            alert('wait a few secs to construct api and try again');
            return;
        }

        const msg = `bein evm:${web3.utils.bytesToHex(ss58Addr).slice(2)}`;
        let ok = true;
        const signature = await web3.eth.personal.sign(msg, connectedEvmAddr)
        .catch(err => {
            console.log(err);
            alert('binding failed');
            ok = false;
        });
        if (!ok) {
            return;
        }

        const injector = await web3FromAddress(ss58Addr);
        await api.tx.evmAccounts
        .claimAccount(connectedEvmAddr, web3.utils.hexToBytes(signature))
        .signAndSend(ss58Addr, {
            signer: injector.signer
        }, ({ events = [], status, dispatchError }) => {
            if (status.isFinalized) {
                console.log(`${ss58Addr} has bound with EVM address: ${connectedEvmAddr}`)
                setBindedEvmAddr(connectedEvmAddr);
            }
        })
        .catch(err => {
            alert('binding failed');
            console.log(err);
        })
    }
    
    return (
        <Card profile>
            <CardHeader>
                <GridItem>
                    <Button color="info" round size="sm" onClick={() => connectPolkadotWallet()}>
                        Connect Polkadot Wallet
                    </Button>
                </GridItem>
                <GridItem>
                    <Button color="info" round size="sm" onClick={() => connectMetamask()}>
                        Connect Metamask Wallet
                    </Button>
                </GridItem>
                <GridItem>
                    <Button color="info" round size="sm" onClick={() => bindingEVMAddress()}>
                        Binding EVM address
                    </Button>
                </GridItem>
            </CardHeader>
            <CardBody>
                <h2>Your wallet</h2>
                {
                    !!ss58Addr &&
                    <div>
                        <h6>Address:<br/>{ss58Addr}</h6>
                        {
                            !!bindedEvmAddr ? 
                            <h6>Binded EVM address: <br/>{bindedEvmAddr}</h6>
                            : <h6 style={{color: 'red'}}>No EVM address is bound to this address</h6>
                        }
                    </div>
                }
                {
                    !!connectedEvmAddr &&
                    <h6>Connected EVM address:<br/>{connectedEvmAddr}</h6>
                }
                {
                    (!!ss58Addr && getBalance()) &&
                    <h4>Free balance:<br/>{balance}</h4>
                }
                <Link onClick={() => props.handleClick(PluginType.CreateToken)}><h4>+ Create your own token</h4></Link>
                <CreateTokenPlugin
                    handleClick={props.handleClick}
                    fixedClasses={props.fixedClasses}
                    pluginTitle="Create Bein's Erc20 Token"
                    pluginType={props.pluginTypeApply}
                />
                <h3>Your bandwidth</h3>
                <h4>1,000/1,000 BIC</h4>
            </CardBody>
        </Card>
    );
}