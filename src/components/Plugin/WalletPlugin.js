/*eslint-disable*/
import React, { Component } from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// nodejs library that concatenates classes


import Button from "components/CustomButtons/Button.js";
import {MenuItem, Select, TextField} from "@material-ui/core";
import PluginType from "./PluginType";

export default function WalletPlugin(props) {
  const [classes, setClasses] = React.useState("dropdown show");
  const [bg_checked, setBg_checked] = React.useState(true);
  const [bgImage, setBgImage] = React.useState(props.bgImage);
  const handleClick = () => {
    props.handleClick();
  };
  if(props.pluginType === PluginType.CreateToken) {
    return (
        <ul className="dropdown-menu">
          <li className="header-title">Create new a Bein's Erc20 token</li>
          <TextField label="Name" color="secondary" focused />
          <TextField label="Symbol" color="secondary" focused />
          <TextField label="Supply" color="secondary" focused />
          <Button color="primary">Create</Button>
        </ul>
    )
  } else if (props.pluginType === PluginType.Tip) {
    return (
        <ul className="dropdown-menu">
          <li className="header-title">Tip for Alec Thompson</li>
          <TextField label="Amount" color="secondary" focused />
          <Select
              label="In"
              value="BIC"
          >
            <MenuItem value="BIC">BIC</MenuItem>
            <MenuItem value="BEIN">BEIN</MenuItem>
          </Select>
          <Button color="primary">Tip</Button>
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
  } else return ("")
}

WalletPlugin.propTypes = {
  handleClick: PropTypes.func,
};
