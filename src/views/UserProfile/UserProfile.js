/* eslint-disable */
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// core components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Button from "components/CustomButtons/Button.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardBody from "components/Card/CardBody.js";
import CardAvatar from "components/Card/CardAvatar.js";
import avatar from "assets/img/faces/marc.jpg";
import imgContent from "assets/img/sidebar-2.jpg";
import {Avatar, CardActions, CardContent, CardMedia, Link, Typography} from "@material-ui/core";
import CardFooter from "../../components/Card/CardFooter";
import PluginType from "../../components/Plugin/PluginType";
import Wallet from "../../components/Wallet/Wallet";
import WalletPlugin from "../../components/Plugin/WalletPlugin";
import classnames from "classnames";
import { Keyring } from '@polkadot/keyring';
import {cryptoWaitReady, mnemonicGenerate, mnemonicToMiniSecret} from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from "@polkadot/api"
import Web3 from 'web3';
import BN from 'bn.js';
import FactoryAbi from "../../abi/Factory.json"
import TokenAbi from "../../abi/Token.json"

const styles = {
  cardCategoryWhite: {
    color: "rgba(255,255,255,.62)",
    margin: "0",
    fontSize: "14px",
    marginTop: "0",
    marginBottom: "0",
  },
  cardTitleWhite: {
    color: "#FFFFFF",
    marginTop: "0px",
    minHeight: "auto",
    fontWeight: "300",
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    marginBottom: "3px",
    textDecoration: "none",
  },
};

const useStyles = makeStyles(styles);

export default function UserProfile() {
  const [fixedClasses, setFixedClasses] = React.useState("dropdown");
  const [pluginTypeApply, setPluginTypeApply] = React.useState(false);
  const [additionInfo, setAdditionInfo] = React.useState({})
  const [walletInfo, setWalletInfo] = React.useState(null)
  const [walletDetailInfo, setWalletDetailInfo] = React.useState(null)
  const [substrateApi, setSubstrateApi] = React.useState(null)
  const keyring = new Keyring({ type: 'sr25519'});
  const web3 = new Web3("http://192.53.173.173:9933");
  const oneUnit = new BN("1000000000000000000")
  const factoryAddress = "0x1214AeF6eCB2b3eAbd0987E42Ea4B9E279689527"

  React.useEffect(() => {
    const mnemonic = localStorage.getItem("bein_mnemonic")
    if(mnemonic && (!walletInfo || walletInfo.mnemonic !== mnemonic)) {
      cryptoWaitReady().then(() => {
        console.log('Olala')
        const pair = keyring.addFromUri(mnemonic, null)
        setWalletInfo({
          mnemonic: mnemonic,
          pair: pair
        })
        getDetailWalletInfo(pair.address)
      })
    }
  }, [walletInfo])

  const getDetailWalletInfo = async (address) => {
    let api = substrateApi;
    if(!api) {
      const wsProvider = new WsProvider('ws://192.53.173.173:9944')
      api = await ApiPromise.create({ provider: wsProvider })
      setSubstrateApi(api)
    }
    console.log('address: ', address)

    if(address) {
      const { nonce, data: balance } = await api.query.system.account(address)
      const totalBandwidth = await api.query.feeless.stakingMap(address)
      const currentBandwidth = await api.query.feeless.bandwidthMap(address)
      const evmAddress = (await api.query.evmAccounts.evmAddresses(address)).toString()
      let tokenInfo = []
      let tokenAddresses = localStorage.getItem('tokenList')
      if(evmAddress && tokenAddresses) {
        for (const address of tokenAddresses.split(' ')) {
          console.log('address: ', address)
          const tokenContract = new web3.eth.Contract(TokenAbi, address);

          const name = await tokenContract.methods.name().call()
          const symbol = await tokenContract.methods.symbol().call()
          const balance = new BN(await tokenContract.methods.balanceOf(evmAddress).call()).div(oneUnit).toString()
          tokenInfo.push({name, symbol, balance})
        }
      }

      setWalletDetailInfo({
        address: address,
        nonce: nonce.toNumber(),
        balance: balance.free.div(oneUnit).toString(),
        reserved: balance.reserved.div(oneUnit).toString(),
        totalBandwidth: totalBandwidth.toString(),
        currentBandwidth: currentBandwidth.toString(),
        evmAddress,tokenInfo
      })
    }
  }

  const tipUser = async (address, amount) => {
    const detailAmount = new BN(amount).mul(oneUnit)
    await substrateApi.tx.balances.transfer(address, detailAmount).signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
      if (status.isFinalized) {
        getDetailWalletInfo(walletDetailInfo.address)
      }
    })
    handleFixedClick(PluginType.DoNothing)
  }

  const stakeForBandwidth = async (amount) => {
    const detailAmount = new BN(amount).mul(oneUnit)
    await substrateApi.tx.feeless.stakeBic(detailAmount).signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
      if (status.isFinalized) {
        getDetailWalletInfo(walletDetailInfo.address)
      }
    })
  }

  const claimEvmAddressLocal = async () => {
    const secret = mnemonicToMiniSecret(walletInfo.mnemonic)
    console.log('walletInfo.mnemonic: ', walletInfo.mnemonic)
    const account = web3.eth.accounts.privateKeyToAccount("0x"+ Buffer.from(secret).toString('hex'))
    const msgClaim = `bein evm:${Buffer.from(walletInfo.pair.publicKey).toString('hex')}`;
    console.log('msgClaim: ', msgClaim)
    const signature = (await account.sign(msgClaim)).signature
    console.log('signature: ', signature)
    await substrateApi.tx.evmAccounts
        .claimAccount(account.address, web3.utils.hexToBytes(signature))
        .signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            getDetailWalletInfo(walletDetailInfo.address)
          }
        }).catch(console.log)
  }

  const createToken = async (name, symbol, totalSupply) => {
    console.log('name: ', name)
    console.log('symbol: ', symbol)
    console.log('totalSupply: ', totalSupply)
    const factoryContract = new web3.eth.Contract(FactoryAbi, factoryAddress);
    const newTokenAbi = factoryContract.methods.createNewToken(name, symbol, totalSupply).encodeABI()
    const gasPrice = await web3.eth.getGasPrice()
    console.log('gasPrice: ', gasPrice)
    const gasLimit = await web3.eth.estimateGas({
      from: walletDetailInfo.evmAddress,
      to: factoryAddress,
      value: '0',
      data: newTokenAbi
    })

    const nonce = await web3.eth.getTransactionCount(walletDetailInfo.evmAddress)
    const tx = {
      from: walletDetailInfo.evmAddress,
      to: factoryAddress,
      value: 0,
      gasPrice: gasPrice,
      gas: gasLimit,
      data: newTokenAbi,
      nonce: nonce
    }
    console.log('tx: ', tx)
    const signed = await web3.eth.accounts.signTransaction(tx, Buffer.from(mnemonicToMiniSecret(localStorage.getItem('bein_mnemonic'))).toString('hex'))
    console.log('signed: ', signed)

    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction)
    console.log('receipt: ', receipt)

    const lastEvent = await factoryContract.getPastEvents("TokenCreated", {fromBlock:receipt.blockNumber, toBlock: receipt.blockNumber})
    console.log('lastEvent: ', lastEvent)
    const tokenAddress = lastEvent[0].returnValues.tokenAddress
    console.log('tokenAddress: ', tokenAddress)
    let tokenList = localStorage.getItem('tokenList')
    if(tokenList) {
      tokenList = tokenList + ' ' + tokenAddress
      localStorage.setItem('tokenList', tokenList)
    } else {
      localStorage.setItem('tokenList', tokenAddress)
    }
  }

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

  const handleFixedClick = (pluginType) => {
    setPluginTypeApply(pluginType);
    if (fixedClasses === "dropdown") {
      setFixedClasses("dropdown show");
    } else {
      setFixedClasses("dropdown");
    }
    if(pluginType === PluginType.Refresh && walletInfo) {
      getDetailWalletInfo(walletInfo.address)
    }
  };

  const createAnOnlineWallet = async () => {
    const mnemonic = mnemonicGenerate()
    localStorage.setItem("bein_mnemonic", mnemonic)
    console.log('mnemonic: ', mnemonic)
    const pair = keyring.addFromUri(mnemonic, null)
    setWalletInfo({
      mnemonic: mnemonic,
      pair: pair
    })
    await getDetailWalletInfo(pair.address)
    setAdditionInfo({
      mnemonic: mnemonic,
    })
    handleFixedClick(PluginType.CreateOnlineWallet)
    // const secret = Buffer.from(mnemonicToMiniSecret(mnemonic)).toString('hex')
    // console.log('mnemonicToMiniSecret: ', secret)
    // const evmAccount = web3.eth.accounts.privateKeyToAccount('0x'+ secret)
    // console.log('evmAccount: ', evmAccount)
  }

  const classes = useStyles();
  return (
    <div>
      <GridContainer>
        <GridItem xs={12} sm={12} md={8}>
          <Card>
            <CardHeader>
              <GridContainer>
                <GridItem md={1}>
                  <CardAvatar plain>
                    <a href="#pablo" onClick={(e) => e.preventDefault()}>
                      <img src={avatar} alt="..."  height="50" width="50"/>
                    </a>
                  </CardAvatar>
                </GridItem>
                <GridItem md={10}>
                  <Typography variant="body1">
                    Alec Thompson
                  </Typography>
                  <Typography variant="subtitle1">
                    September 14, 2016
                  </Typography>
                </GridItem>
                <GridItem md={1}>
                  <Button  onClick={() => handleFixedClick(PluginType.Tip)}>Tip</Button>
                </GridItem>
              </GridContainer>
            </CardHeader>
            <CardBody>
              <img src={imgContent} height="300" width="300"/>
            </CardBody>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                This impressive paella is a perfect party dish and a fun meal to cook
                together with your guests. Add 1 cup of frozen peas along with the mussels,
                if you like.
              </Typography>
            </CardContent>
            <CardFooter chart>
                <GridItem md={2}>
                  <CardAvatar plain>
                    <a href="#pablo" onClick={(e) => e.preventDefault()}>
                      <img src={avatar} alt="..."  height="25" width="25"/>
                    </a>
                  </CardAvatar>
                  <Typography variant="body2">
                    Alec Thompson
                  </Typography>

                </GridItem>
                <GridItem md={9}>
                  <Typography variant="subtitle2">
                    Sep 14, 2016
                  </Typography>
                  <Typography variant="body2">
                    hahaha
                  </Typography>
                </GridItem>
                <GridItem md={1}>
                  <Button  onClick={() => handleFixedClick(PluginType.Tip)}>Tip</Button>
                </GridItem>
            </CardFooter>
            <CardFooter chart>
                <GridItem md={2}>
                  <CardAvatar plain>
                    <a href="#pablo" onClick={(e) => e.preventDefault()}>
                      <img src={avatar} alt="..."  height="25" width="25"/>
                    </a>
                  </CardAvatar>
                  <Typography variant="body2">
                    Alec Thompson
                  </Typography>

                </GridItem>
                <GridItem md={9}>
                  <Typography variant="subtitle2">
                    Sep 14, 2016
                  </Typography>
                  <Typography variant="body2">
                    hahaha
                  </Typography>
                </GridItem>
                <GridItem md={1}>
                  <Button  onClick={() => handleFixedClick(PluginType.Tip)}>Tip</Button>
                </GridItem>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={12} md={4}>
          <Card profile>
            <CardAvatar profile>
              <a href="#pablo" onClick={(e) => e.preventDefault()}>
                <img src={avatar} alt="..." />
              </a>
            </CardAvatar>
            <CardBody profile>
              <h6 className={classes.cardCategory}>CEO / CO-FOUNDER</h6>
              <h4 className={classes.cardTitle}>Alec Thompson</h4>
              <p className={classes.description}>
                Don{"'"}t be scared of the truth because we need to restart the
                human foundation in truth And I love you like Kanye loves Kanye
                I love Rick Owens’ bed design but the back is...
              </p>
              <Button color="primary" round>
                Follow
              </Button>
            </CardBody>
          </Card>
          <Card profile>
            <CardBody>
              <Wallet handleFixedClick={handleFixedClick} createAnOnlineWallet={createAnOnlineWallet} walletDetailInfo={walletDetailInfo} claimEvmAddress={claimEvmAddressLocal}/>
              <div
                  className={classnames("fixed-plugin")}
              >
                <div id="fixedPluginClasses" className={fixedClasses}>
                  <div onClick={handleFixedClick}>
                    <i className="fa fa-exchange fa-2x" />
                    </div>
                      <WalletPlugin
                          handleClick={handleFixedClick}
                          fixedClasses={fixedClasses}
                          pluginTitle="Create Bein's Erc20 Token"
                          pluginType={pluginTypeApply}
                          additionInfo={additionInfo}
                          stakeForBandwidth={stakeForBandwidth}
                          tipUser={tipUser}
                          createToken={createToken}
                      />
                </div>
              </div>
            </CardBody>
          </Card>

        </GridItem>
      </GridContainer>
    </div>
  );
}
