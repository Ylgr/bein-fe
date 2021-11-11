/*eslint-disable*/
import React, { Component } from "react";
// nodejs library to set properties for components
import PropTypes from "prop-types";
// nodejs library that concatenates classes
import classnames from "classnames";

import imagine1 from "assets/img/sidebar-1.jpg";
import imagine2 from "assets/img/sidebar-2.jpg";
import imagine3 from "assets/img/sidebar-3.jpg";
import imagine4 from "assets/img/sidebar-4.jpg";

import Button from "components/CustomButtons/Button.js";
import {MenuItem, Select, TextField} from "@material-ui/core";
import PluginType from "./PluginType";

export default function CreateTokenPlugin(props) {
  const [classes, setClasses] = React.useState("dropdown show");
  const [bg_checked, setBg_checked] = React.useState(true);
  const [bgImage, setBgImage] = React.useState(props.bgImage);
  const handleClick = () => {
    props.handleClick();
  };
  return (
    <div
      className={classnames("fixed-plugin")}
    >
      <div id="fixedPluginClasses" className={props.fixedClasses}>
        <div onClick={handleClick}>
          <i className="fa fa-exchange fa-2x" />
        </div>
        {props.pluginType === PluginType.CreateToken ?
            <ul className="dropdown-menu">
              <li className="header-title">Create new a Bein's Erc20 token</li>
              <TextField label="Name" color="secondary" focused />
              <TextField label="Symbol" color="secondary" focused />
              <TextField label="Supply" color="secondary" focused />
              <Button color="primary">Create</Button>
            </ul>
            : props.pluginType === PluginType.Tip ?
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
                :
            ""
        }


      </div>
    </div>
  );
}

CreateTokenPlugin.propTypes = {
  handleClick: PropTypes.func,
};
