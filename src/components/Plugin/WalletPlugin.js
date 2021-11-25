/*eslint-disable*/
import React, {Component} from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// nodejs library that concatenates classes


import Button from "components/CustomButtons/Button.js";
import {MenuItem, Select, Input} from "@material-ui/core";
import PluginType from "./PluginType";

export default function WalletPlugin(props) {
    const [stakeAmount, setStakeAmount] = React.useState(0)
    const [tipAmount, setTipAmount] = React.useState(0)
    const [newTokenName, setNewTokenName] = React.useState('')
    const [newTokenSymbol, setNewTokenSymbol] = React.useState('')
    const [newTokenSupply, setNewTokenSupply] = React.useState('')
    const [tipToken, setTipToken] = React.useState('BIC')
    const handleClick = () => {
        props.handleClick();
    };
    if (props.pluginType === PluginType.CreateToken) {
        return (
            <ul className="dropdown-menu">
                <li className="header-title">Create new a Bein's Erc20 token</li>
                <Input label="Name" color="secondary" focused value={newTokenName} onChange={(event) => setNewTokenName(event.target.value)}/>
                <Input label="Symbol" color="secondary" focused value={newTokenSymbol} onChange={(event) => setNewTokenSymbol(event.target.value)}/>
                <Input label="Supply" type="number" color="secondary" focused value={newTokenSupply} onChange={(event) => setNewTokenSupply(event.target.value)}/>
                <Button color="primary" onClick={() => props.createToken(newTokenName, newTokenSymbol, newTokenSupply)}>Create</Button>
            </ul>
        )
    } else if (props.pluginType === PluginType.Tip) {
        return (
            <ul className="dropdown-menu">
                <li className="header-title">Tip for Alec Thompson</li>
                <Input label="Amount" color="secondary" focused type="number" value={tipAmount} onChange={(event) => setTipAmount(event.target.value)} />
                <Select
                    label="In"
                    value={tipToken}
                    onChange={(event) => setTipToken(event.target.value)}
                >
                    <MenuItem value="BIC">BIC</MenuItem>
                    {props.tokenInfo.map(tokenInfo => <MenuItem value={tokenInfo.address}>{tokenInfo.symbol}</MenuItem>)}
                </Select>
                <Button color="primary" onClick={() => {
                    if(tipToken === "BIC") return props.tipUser("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", tipAmount)
                    else return props.tipUserByToken("5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", tipAmount, tipToken)
                }}>Tip</Button>
            </ul>
        )
    } else if (props.pluginType === PluginType.CreateOnlineWallet) {
        return (
            <ul className="dropdown-menu">
                <li className="header-title">Your seed phrase:</li>
                <li className="adjustments-line">{props.additionInfo.mnemonic}</li>
                <Button color="primary" onClick={() => handleClick()}>I have already noted</Button>
            </ul>
        )
    } else if (props.pluginType === PluginType.Stake) {
        return (
            <ul className="dropdown-menu">
                <li className="header-title" onClick={() => props.stakeForBandwidth()}>Staking for bandwidth</li>
                <Input label="Amount" color="secondary" focused type="number" value={stakeAmount} onChange={(event) => setStakeAmount(event.target.value)} />
                <h5>BIC</h5>
                <Button color="primary" onClick={() => props.stakeForBandwidth(stakeAmount)}>Stake</Button>
            </ul>
        )
    } else if (props.pluginType === PluginType.UnStake) {
        return (
            <ul className="dropdown-menu">
                <li className="header-title">Unstaking bandwidth for BIC</li>
                <Input label="Amount" color="secondary" focused/>
                <h5>BIC</h5>
                <Button color="primary">Unstake</Button>
            </ul>
        )
    } else return ("")
}

WalletPlugin.propTypes = {
    handleClick: PropTypes.func,
};
