/* eslint-disable */

import {Link} from "@material-ui/core";
import PluginType from "../Plugin/PluginType";
import React from "react";
import Button from "components/CustomButtons/Button.js";

export default function Wallet({handleFixedClick, createAnOnlineWallet, walletDetailInfo, claimEvmAddress}) {
    console.log('walletDetailInfo: ', walletDetailInfo)
    if (walletDetailInfo) {
        return (
            <div>
                <h2>Your wallet</h2>
                <p>{walletDetailInfo.address}</p>
                <h4>{walletDetailInfo.balance} BIC</h4>
                {walletDetailInfo.evmAddress === ""
                    ? <Link onClick={() => claimEvmAddress()}><h4>You don't have token wallet, create now!</h4></Link>
                    :<div>
                        <h4>Token wallet address: </h4>
                        <h6>{walletDetailInfo.evmAddress}</h6>
                        <h5>Your token:</h5>
                        <p>You still don't have any token</p>
                        <Link onClick={() => handleFixedClick(PluginType.CreateToken)}><h4>+ Create your own token!</h4></Link>
                    </div>
                }

                <h3>Your bandwidth</h3>
                <h4>{walletDetailInfo.currentBandwidth}/{walletDetailInfo.totalBandwidth}</h4>
                <h4>Reserved:{walletDetailInfo.reserved} BIC</h4>

                <Button onClick={() => handleFixedClick(PluginType.Stake)} color="success" round> Stake</Button>
                <Button onClick={() => handleFixedClick(PluginType.UnStake)} color="warning" round>UnStake</Button>
            </div>
        )
    } else return (
        <div>
            <h2>You don't have a Bein Wallet</h2>
            <Link onClick={() => createAnOnlineWallet()}><h4>Create an online one</h4></Link>
            <p>(Recommend for basic user)</p>
            <h3>Or</h3>
            <Link onClick={() => handleFixedClick(PluginType.CreateToken)}><h4>Connect with Polkadot.JS extension and Metamask</h4></Link>
            <p>(Recommend for developer)</p>
        </div>
    )
}
