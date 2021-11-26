/* eslint-disable */

import {Link} from "@material-ui/core";
import PluginType from "../Plugin/PluginType";
import React from "react";
import Button from "components/CustomButtons/Button.js";
import { plugins } from "chartist";
import GridItem from "components/Grid/GridItem";

export default function Wallet(props) {
    if (props.mode === PluginType.ChooseWallet) {
        return (
            <div>
                <h2>You don't have a Bein Wallet</h2>
                <Link onClick={() => props.changeMode(PluginType.BrowserWallet)}><h4>Create an online one</h4></Link>
                <p>(Recommend for basic user)</p>
                <h3>Or</h3>
                <Link onClick={() => props.changeMode(PluginType.ExtensionWallet)}><h4>Connect with Polkadot.JS extension and Metamask</h4></Link>
                <p>(Recommend for developer)</p>
            </div>
        )
    } else if (props.mode === PluginType.BrowserWallet) {
        return (
            <div>
                <h2>Your wallet</h2>
                <p>{props.ss58Addr}</p>
                {
                    (!!props.ss58Addr && props.SubWalletInfo.subBalance(props.ss58Addr)) &&
                    <h4>{props.balance} BIC</h4>
                }
                {
                    props.bindedEvmAddr === null
                    ? <Link onClick={() => props.BrowserWallet.claimEvmAddressLocal()}><h4>You don't have token wallet, create now!</h4></Link>
                    : <div>
                        <h4>Token wallet address: </h4>
                        <h6>{props.bindedEvmAddr}</h6>
                        <h5>Your token:</h5>
                        {
                            props.tokenInfo.length === 0 ?
                            <p>You still don't have any token</p>
                            : props.tokenInfo.map(tokenInfo => <p>{tokenInfo.balance + " " + tokenInfo.symbol}</p>)
                        }

                        <Link onClick={() => props.handleFixedClick(PluginType.CreateToken)}><h4>+ Create your own token!</h4></Link>
                    </div>
                }

                <h3>Your remain bandwidth</h3>
                {
                    (!!props.ss58Addr && props.SubWalletInfo.subBandwidth(props.ss58Addr)) &&
                    <h4>{props.remainBandwidth}</h4>
                }

                <Button onClick={() => props.handleFixedClick(PluginType.Stake)} color="success" round>Stake</Button>
                <Button onClick={() => props.handleFixedClick(PluginType.UnStake)} color="warning" round>UnStake</Button>
            </div>
        )
    } else { // PluginType.ExtensionWallet
        return (
            <div>
                <div>
                    <GridItem>
                        <Button color="info" round size="sm" onClick={() => props.ExtensionWallet.connectPolkadotWallet()}>
                            Connect Polkadot Wallet
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button color="info" round size="sm" onClick={() => props.ExtensionWallet.connectMetamask()}>
                            Connect Metamask Wallet
                        </Button>
                    </GridItem>
                    <GridItem>
                        <Button color="info" round size="sm" onClick={() => props.ExtensionWallet.bindingEVMAddress()}>
                            Binding EVM address
                        </Button>
                    </GridItem>
                </div>

                <h2>Your wallet</h2>
                <p>{props.ss58Addr}</p>
                {
                    (!!props.ss58Addr && props.SubWalletInfo.subBalance(props.ss58Addr)) &&
                    <h4>{props.balance} BIC</h4>
                }
                {
                    !!props.connectedEvmAddr &&
                    <h6>Connected EVM address:<br/>{props.connectedEvmAddr}</h6>
                }
                {
                    props.bindedEvmAddr === null
                    ? <h4>You don't have token wallet, create now by binding EVM address!</h4>
                    : <div>
                        <h4>Token wallet address: </h4>
                        <h6>{props.bindedEvmAddr}</h6>
                        <h5>Your token:</h5>
                        {
                            props.tokenInfo.length === 0 ?
                            <p>You still don't have any token</p>
                            : props.tokenInfo.map(tokenInfo => <p>{tokenInfo.balance + " " + tokenInfo.symbol}</p>)
                        }

                        <Link onClick={() => props.handleFixedClick(PluginType.CreateToken)}><h4>+ Create your own token!</h4></Link>
                    </div>
                }

                <h3>Your remain bandwidth</h3>
                {
                    (!!props.ss58Addr && props.SubWalletInfo.subBandwidth(props.ss58Addr)) &&
                    <h4>{props.remainBandwidth}</h4>
                }

                <Button onClick={() => props.handleFixedClick(PluginType.Stake)} color="success" round>Stake</Button>
                <Button onClick={() => props.handleFixedClick(PluginType.UnStake)} color="warning" round>UnStake</Button>

            </div>
        )
    }
}
