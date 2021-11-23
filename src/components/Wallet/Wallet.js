/* eslint-disable */

import {Link} from "@material-ui/core";
import PluginType from "../Plugin/PluginType";
import React from "react";

export default function Wallet({handleFixedClick, createAnOnlineWallet, walletDetailInfo}) {
    console.log('walletDetailInfo: ', walletDetailInfo)
    if (walletDetailInfo) {
        return (
            <div>
                <h2>Your wallet</h2>
                <p>{walletDetailInfo.address}</p>
                <h4>{walletDetailInfo.balance} BIC</h4>
                <Link onClick={() => handleFixedClick(PluginType.CreateToken)}><h4>+ Create your own token</h4></Link>

                <h3>Your bandwidth</h3>
                <h4>1,000/1,000 BIC</h4>
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
