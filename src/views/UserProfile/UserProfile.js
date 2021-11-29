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
import avatar from "assets/img/faces/bob.png";
import alice from "assets/img/faces/alice.jpeg";
import eve from "assets/img/faces/eve.jpeg";
import imgContent from "assets/img/polkadot-apac.png";
import {Avatar, CardActions, CardContent, CardMedia, Link, Typography} from "@material-ui/core";
import CardFooter from "../../components/Card/CardFooter";
import PluginType from "../../components/Plugin/PluginType";
import Wallet from "../../components/Wallet/Wallet";
import WalletPlugin from "../../components/Plugin/WalletPlugin";
import classnames from "classnames";
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, mnemonicGenerate, mnemonicToMiniSecret, decodeAddress } from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from "@polkadot/api";
import FactoryAbi from "../../abi/FactoryAbi.json";
import TokenAbi from "../../abi/TokenAbi.json";
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';
import Web3 from 'web3';
import BN from 'bn.js';
import HourglassFull from "@material-ui/icons/HourglassFull";
import SmsFailedIcon from '@material-ui/icons/SmsFailed';
import Done from "@material-ui/icons/Done";
import Snackbar from "components/Snackbar/Snackbar.js";

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

  const [substrateApi, setSubstrateApi] = React.useState(null);
  const [web3, setWeb3] = React.useState(null);
  const [mode, setMode] = React.useState(PluginType.ChooseWallet);

  const [balance, setBalance] = React.useState("0");
  const [remainBandwidth, setRemainBandwidth] = React.useState("0");
  const [bindedEvmAddr, setBindedEvmAddr] = React.useState(null);
  const [connectedEvmAddr, setConnectEvmAddr] = React.useState(null);
  const [ss58Addr, setSS58Addr] = React.useState(null);
  const [tokenInfo, setTokenInfo] = React.useState([]);

  // browser wallet
  const [mnemonic, setMnemonic] = React.useState(null);
  const [walletInfo, setWalletInfo] = React.useState(null);

  // notification
  const [notificationInfo, setNotificationInfo] = React.useState({})
  const [isNotification, setIsNotification] = React.useState(false)

  // CONST
  const nodeurl = '192.53.173.173:9944';
  const nodeweb3 = '192.53.173.173:9933';
  const keyring = new Keyring({ type: 'sr25519' });
  const oneUnit = new BN("1000000000000000000");
  const factoryAddress = '0x8459c3A7929dcF26323Ad0D42a34A69A63aB0ADa';

  React.useEffect(() => {  
    return () => {
      SubWalletInfo.unsubAll();
    }
  });


  const initTx = async (from, to, value, data) => {
    const gasPrice = await web3.eth.getGasPrice();
    console.log("gasPrice", gasPrice);
    const txConfig = {
      from,
      to,
      value,
      data
    }
    const gasLimit = await web3.eth.estimateGas(txConfig);
    const nonce = await web3.eth.getTransactionCount(from);
    const tx = {
      ...txConfig,
      nonce: nonce.toString(),
      gasPrice: gasPrice.toString(),
      gas: gasLimit.toString()
    }
    console.log('init tx', tx);
    return tx;
  }

  const sendTxMetamask = (rawTx) => {
    const { ethereum } = window
    return ethereum.request({
      method: 'eth_sendTransaction',
      params: [rawTx],
    })
  }

  const getTokenInfo = async (evmAddress) => {
    const web3 = new Web3(`http://${nodeweb3}`);
    let tokenInfo = [];
    let tokenAddresses = localStorage.getItem(evmAddress);
    if(!tokenAddresses) {
      return;
    }
    try {
      for (const address of tokenAddresses.split(' ')) {
        if (address === '') {
          continue;
        }
        const tokenContract = new web3.eth.Contract(TokenAbi, address);
        const name = await tokenContract.methods.name().call();
        const symbol = await tokenContract.methods.symbol().call();
        const balance = (new BN(await tokenContract.methods.balanceOf(evmAddress).call())/oneUnit).toString();
        tokenInfo.push({name, symbol, balance, address});
      }

    } catch (err) {
      console.log(err);
    }
    console.log(tokenInfo);
    setTokenInfo(tokenInfo);
    return;
  }

  // sub to get data
  const SubWalletInfo = {
    subBalance: async (address) => {
      console.log("subBalance");
      if (!substrateApi) {
        return false;
      }
      const unsub = await substrateApi.query.system.account(address, ({ nonce, data: balance }) => {
        let free = new BN(`${balance.free}`);
        free =(free/oneUnit).toString();
        setBalance(free);
        console.log(free);
      });
      SubWalletInfo.addUnSub(unsub);
      return true;
    },

    subBandwidth: async (address) => {
      if (!substrateApi) {
        return false;
      }
      const unsub = await substrateApi.query.feeless.bandwidthMap(address, (rmbandwidth) => {
        setRemainBandwidth(rmbandwidth.toString());
      });
      SubWalletInfo.addUnSub(unsub);
      return true;
    },

    addUnSub: (unsub) => {
      SubWalletInfo.unsubArray.push(unsub);
    },

    unsubAll: () => {
      SubWalletInfo.unsubArray.forEach(unsub => unsub());
      SubWalletInfo.unsubArray = [];
    },

    unsubArray: []
  }

  const BrowserWallet = {
    init: async () => {
      setWeb3(new Web3(`http://${nodeweb3}`));
      const wsProvider = new WsProvider(`ws://${nodeurl}`)
      const api = await ApiPromise.create({ provider: wsProvider })
      setSubstrateApi(api)
      await BrowserWallet.createAnOnlineWallet(api);
    },

    createAnOnlineWallet: async (api) => {
      let mnemonic = localStorage.getItem("browser_wallet_mnemonic");
      if (mnemonic === null) {
        mnemonic = mnemonicGenerate();
        localStorage.setItem("browser_wallet_mnemonic", mnemonic);
      }
      setMnemonic(mnemonic);
      console.log('mnemonic: ', mnemonic)
      const pair = keyring.addFromUri(mnemonic, null)
      setSS58Addr(pair.address);
      setWalletInfo({
        mnemonic: mnemonic,
        pair: pair
      });
      // noti
      setNotificationInfo({
        color: 'success',
        icon: Done,
        message: 'create wallet done'
      });
      showNotification();

      const evmAddr = (await api.query.evmAccounts.evmAddresses(pair.address)).toString();
      console.log(evmAddr);
      if (evmAddr !== '') {
          setBindedEvmAddr(evmAddr);
          await getTokenInfo(evmAddr);
      }
      handleFixedClick(PluginType.CreateOnlineWallet)
    },

    claimEvmAddressLocal: async () => {
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'creating evm address'
      });
      setIsNotification(true);
      const secret = mnemonicToMiniSecret(walletInfo.mnemonic)
      const account = web3.eth.accounts.privateKeyToAccount("0x" + Buffer.from(secret).toString('hex'));
      const msgClaim = `bein evm:${Buffer.from(walletInfo.pair.publicKey).toString('hex')}`;
      const signature = (await account.sign(msgClaim)).signature
      await substrateApi.tx.evmAccounts
        .claimAccount(account.address, web3.utils.hexToBytes(signature))
        .signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            setBindedEvmAddr(account.address);
            // noti
            setNotificationInfo({
              color: 'success',
              icon: Done,
              message: 'created and binded evm address'
            });
            showNotification();
          }
        }).catch((err) => {
          console.log(err);
          // noti
          setNotificationInfo({
            color: 'danger',
            icon: SmsFailedIcon,
            message: 'failed to binded evm address'
          });
          showNotification();
        })
    },

    createToken: async (name, symbol, totalSupply) => {
      console.log(name);
      console.log(symbol);
      console.log(totalSupply);
      //noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'creating new token'
      });
      setIsNotification(true);
      try {
        const factoryContract = new web3.eth.Contract(FactoryAbi, factoryAddress);
        const data = factoryContract.methods.createNewToken(name, symbol, totalSupply).encodeABI();
        const tx = await initTx(bindedEvmAddr, factoryAddress, '0', data);
        const signed = await web3.eth.accounts.signTransaction(tx, Buffer.from(mnemonicToMiniSecret(mnemonic)).toString('hex'));
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        const lastEvent = await factoryContract.getPastEvents("TokenCreated", { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber });
        const tokenAddress = lastEvent[0].returnValues.tokenAddress;
        let tokenList = localStorage.getItem(bindedEvmAddr);
        if (!tokenList) {
          tokenList = tokenAddress;
        } else {
          tokenList = tokenList + ' ' + tokenAddress;
        }
        localStorage.setItem(bindedEvmAddr, tokenList);
        await getTokenInfo(bindedEvmAddr);

        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'created new token'
        });
        showNotification(true);
      } catch (err) {
        console.log(err);
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'failed to create new token'
        });
        showNotification(true);
      }
    },

    tipUserByToken: async (address, amount, tokenAddress) => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'tipping user by token'
      });
      setIsNotification(true);

      const detailAmount = new BN(amount).mul(oneUnit);
      const tokenContract = new web3.eth.Contract(TokenAbi, tokenAddress);
      const data = tokenContract.methods.transfer(address, detailAmount).encodeABI();
      const tx = await initTx(bindedEvmAddr, tokenAddress, '0', data);
      try {
        const signed = await web3.eth.accounts.signTransaction(tx, Buffer.from(mnemonicToMiniSecret(mnemonic)).toString('hex'))
        const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction);
        await getTokenInfo(bindedEvmAddr);
        handleFixedClick(PluginType.DoNothing);
        // noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'tipped user by token'
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'failed to tip user by token'
        });
        showNotification();
      }
    },

    tipUser: async (address, amount) => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'tipping user by BIC'
      });
      setIsNotification(true);

      const detailAmount = new BN(amount).mul(oneUnit)
      const subCall = substrateApi.tx.balances.transfer(address, detailAmount);
      try {
        await substrateApi.tx.feeless.feelessCall(subCall).signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('tipUser done');
          }
        })
        //noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'tipped user by BIC'
        });
        showNotification();
        handleFixedClick(PluginType.DoNothing)
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'failed to tip user by BIC'
        });
        showNotification();
      }
    },

    stakeForBandwidth: async (amount) => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'staking BIC for free bandwidth'
      });
      setIsNotification(true);

      const detailAmount = new BN(amount).mul(oneUnit);
      try {
        await substrateApi.tx.feeless.stakeBic(detailAmount).signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('staked');
          }
        });
        //noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'Stake BIC successfully'
        });
        showNotification();
      } catch (err) {
        console.log(err);
        // noti
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'Failed to stake BIC'
        });
        showNotification();
      }
    },

    unstakeAll: async() => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'staking BIC for free bandwidth'
      });
      setIsNotification(true);

      try {
        await substrateApi.tx.feeless.unstakeBic().signAndSend(walletInfo.pair, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('unstaked');
          }
        });
        //noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'Unstaked all BIC'
        });
        showNotification();
      } catch (err) {
        console.log(err);
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'Failed unstake'
        });
        showNotification();
      }
    }
  }

  const ExtensionWallet = {
    connectMetamask: async () => {
      //noti
      setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "connecting to metamask"
      });
      setIsNotification(true);
      if (!!window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" })
        setWeb3(web3);
        const addresses = await web3.eth.getAccounts();
        setConnectEvmAddr(addresses[0]);

        window.ethereum.on('accountsChanged', (addresses) => {
          setConnectEvmAddr(addresses[0])
        });
        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "connected to metamask"
        });
        showNotification();
      } else {
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "cannot detect metamask"
        });
        showNotification();
      }
    },

    connectPolkadotWallet: async () => {
       //noti
       setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "connecting to polkadot wallet"
      });
      setIsNotification(true);

      try {
        const extension = await web3Enable('Polkadot Hackathon');
        if (extension.length === 0) {
          throw new Error('Connect detect polkadot wallet');
        }
        const allAccounts = await web3Accounts();
        if (allAccounts.length === 0) {
          throw new Error('Please create an account and try again');
        }
        setSS58Addr(allAccounts[0].address);

        const wsProvider = new WsProvider(`ws://${nodeurl}`);
        const api = await ApiPromise.create({ provider: wsProvider });
        setSubstrateApi(api);
        const evmAddr = (await api.query.evmAccounts.evmAddresses(allAccounts[0].address)).toString();
        if (evmAddr !== '') {
          setBindedEvmAddr(evmAddr)
        }
        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "connected to polkadot wallet"
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "cannot detect polkadot wallet"
        });
        showNotification();
      }
    },

    bindingEVMAddress: async () => {
      //noti
      setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "binding evm address"
      });
      setIsNotification(true);

      try {
        if (!!bindedEvmAddr) {
          throw new Error('EVM address already binded');
        }
        if (!ss58Addr || !connectedEvmAddr) {
          throw new Error('Need connecting to 2 wallets');
        }
        if (!substrateApi) {
          throw new Error('wait a few secs to construct api and try again');
        }
        const publicKey = decodeAddress(ss58Addr);
        const msg = `bein evm:${Buffer.from(publicKey).toString('hex')}`
        let ok = true;
        const signature = await web3.eth.personal.sign(msg, connectedEvmAddr)
          .catch(err => {
            console.log(err);
            ok = false;
          });
        if (!ok) {
          throw new Error('signed failed');
        }

        const injector = await web3FromAddress(ss58Addr);
        await substrateApi.tx.evmAccounts
          .claimAccount(connectedEvmAddr, web3.utils.hexToBytes(signature))
          .signAndSend(ss58Addr, {
            signer: injector.signer
          }, ({ events = [], status, dispatchError }) => {
            if (status.isFinalized) {
              console.log(`${ss58Addr} has bound with EVM address: ${connectedEvmAddr}`)
              setBindedEvmAddr(connectedEvmAddr);
            }
          })
        
        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "binded evm address"
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "failed to bind evm address"
        });
        showNotification();
      }
    },

    createToken: async (name, symbol, totalSupply) => {
      if (!connectedEvmAddr) {
        //noti
        setNotificationInfo({
          color: "danger",
          icon: HourglassFull,
          message: "please connect evm address"
        });
        setIsNotification(true);
        return;
      }
      if (!!bindedEvmAddr && (bindedEvmAddr.toUpperCase() !== connectedEvmAddr.toUpperCase())) {
        //noti
        setNotificationInfo({
          color: "danger",
          icon: HourglassFull,
          message: "please connect metamask with binded account"
        });
        setIsNotification(true);
        return;
      }

      //noti
      setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "creating erc20 token"
      });
      setIsNotification(true);

      try {
        const factoryContract = new web3.eth.Contract(FactoryAbi, factoryAddress);
        const data = factoryContract.methods.createNewToken(name, symbol, totalSupply).encodeABI();
        const tx = await initTx(bindedEvmAddr, factoryAddress, '0', data);
        const txHash = await sendTxMetamask(tx);

        let cntSleep = 0;
        let receipt;
        while (cntSleep <= 6000 * 3) {
          receipt = await web3.eth.getTransactionReceipt(txHash);
          if (receipt === null) {
            await sleep(3000);
            cntSleep += 3000;
            continue;
          }
          break;
        }

        if (receipt.status === false) {
          throw new Error("tx failed");
        }

        console.log('receipt', receipt);
        const lastEvent = await factoryContract.getPastEvents("TokenCreated", { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber });
        const tokenAddress = lastEvent[0].returnValues.tokenAddress;
        console.log(tokenAddress);
        let tokenList = localStorage.getItem(bindedEvmAddr);
        if (!tokenList) {
          tokenList = tokenAddress;
        } else {
          tokenList = tokenList + ' ' + tokenAddress;
        }
        localStorage.setItem(bindedEvmAddr, tokenList);
        await getTokenInfo(bindedEvmAddr);

        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "created new token"
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "met some error when make txs with metamask"
        });
        showNotification();
      }
    },

    tipUser: async (address, amount) => {
      //noti
      setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "tipping user with BIC"
      });
      setIsNotification(true);
      try {
        const detailAmount = new BN(amount).mul(oneUnit);
        const subCall = substrateApi.tx.balances.transfer(address, detailAmount);
        const injector = await web3FromAddress(ss58Addr);
        await substrateApi.tx.feeless.feelessCall(subCall).signAndSend(ss58Addr, {
          signer: injector.signer
        }, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('ok tip with extension wallet');
          }
        })
        handleFixedClick(PluginType.DoNothing)
        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "tipped user with BIC"
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "failed to tip user with BIC"
        });
        showNotification();
      }
    },

    tipUserByToken: async (address, amount, tokenAddress) => {
      //noti
      setNotificationInfo({
        color: "warning",
        icon: HourglassFull,
        message: "tipping user with token"
      });
      setIsNotification(true);
      try {
        const detailAmount = new BN(amount).mul(oneUnit);
        const tokenContract = new web3.eth.Contract(TokenAbi, tokenAddress);
        const data = tokenContract.methods.transfer(address, detailAmount).encodeABI();
        const tx = await initTx(bindedEvmAddr, tokenAddress, '0', data);
        await sendTxMetamask(tx);
        await getTokenInfo(bindedEvmAddr);
        handleFixedClick(PluginType.DoNothing);
        //noti
        setNotificationInfo({
          color: "success",
          icon: Done,
          message: "tipped user with token"
        });
        showNotification();
      } catch (err) {
        console.log(err);
        //noti
        setNotificationInfo({
          color: "danger",
          icon: SmsFailedIcon,
          message: "failed to tip user with token"
        });
        showNotification();
      }
    },

    stakeForBandwidth: async (amount) => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'staking BIC for free bandwidth'
      });
      setIsNotification(true);
      try {
        const detailAmount = new BN(amount).mul(oneUnit);
        const injector = await web3FromAddress(ss58Addr);
        await substrateApi.tx.feeless.stakeBic(detailAmount).signAndSend(ss58Addr, {
          signer: injector.signer
        }, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('ok staked with extension wallet');
          }
        });
        //noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'Stake BIC successfully'
        });
        showNotification();
      } catch (err) {
        console.log(err);
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'Failed to stake BIC'
        });
        showNotification();
      }
    },

    unstakeAll: async() => {
      // noti
      setNotificationInfo({
        color: 'warning',
        icon: HourglassFull,
        message: 'staking BIC for free bandwidth'
      });
      setIsNotification(true);
      try {
        const injector = await web3FromAddress(ss58Addr);
        await substrateApi.tx.feeless.unstakeBic().signAndSend(ss58Addr, {
          signer: injector.signer
        }, ({ events = [], status, dispatchError }) => {
          if (status.isFinalized) {
            console.log('ok staked with extension wallet');
          }
        })
        //noti
        setNotificationInfo({
          color: 'success',
          icon: Done,
          message: 'Unstaked all BIC'
        });
        showNotification();
      } catch (err) {
        console.log(err);
        setNotificationInfo({
          color: 'danger',
          icon: SmsFailedIcon,
          message: 'Failed unstake'
        });
        showNotification();
      }
    }
  }

  const handleFixedClick = (pluginType) => {
    setPluginTypeApply(pluginType);
    if (fixedClasses === "dropdown") {
      setFixedClasses("dropdown show");
    } else {
      setFixedClasses("dropdown");
    }
  };

  const changeMode = async (toMode) => {
    if (mode === PluginType.ChooseWallet) {
      if (toMode === PluginType.BrowserWallet) {
        await BrowserWallet.init();
      }
    }
    setMode(toMode);
  }

  const showNotification = () => {
    setIsNotification(true);
    setTimeout(function () {
      setIsNotification(false);
    }, 3000);
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
                    <a href="#bob" onClick={(e) => e.preventDefault()}>
                      <img src={avatar} alt="..."  height="50" width="50"/>
                    </a>
                  </CardAvatar>
                </GridItem>
                <GridItem md={10}>
                  <Typography variant="body1">
                    Bob
                  </Typography>
                  <Typography variant="subtitle1">
                    September 14, 2016
                  </Typography>
                </GridItem>
                <GridItem md={1}>
                  <Button onClick={() => handleFixedClick(PluginType.Tip)}>Tip</Button>
                </GridItem>
              </GridContainer>
            </CardHeader>
            <CardBody>
              <img src={imgContent} height="300" width="300" />
            </CardBody>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                The Polkadot Hackathon Series kicking off in Asia Pacific (APAC) on October 22.
                And I am in!
              </Typography>
            </CardContent>
            <CardFooter chart>
                <GridItem md={2}>
                  <CardAvatar plain>
                    <a href="#alice" onClick={(e) => e.preventDefault()}>
                      <img src={alice} alt="..."  height="25" width="25"/>
                    </a>
                  </CardAvatar>
                  <Typography variant="body2">
                    Alice
                  </Typography>

                </GridItem>
                <GridItem md={9}>
                  <Typography variant="subtitle2">
                    Sep 14, 2016
                  </Typography>
                  <Typography variant="body2">
                    That's great! May I join as well?
                  </Typography>
                </GridItem>
                <GridItem md={1}>
                  <Button  onClick={() => handleFixedClick(PluginType.Tip)}>Tip</Button>
                </GridItem>
            </CardFooter>
            <CardFooter chart>
                <GridItem md={2}>
                  <CardAvatar plain>
                    <a href="#eve" onClick={(e) => e.preventDefault()}>
                      <img src={eve} alt="..."  height="25" width="25"/>
                    </a>
                  </CardAvatar>
                  <Typography variant="body2">
                    Eve
                  </Typography>

                </GridItem>
                <GridItem md={9}>
                  <Typography variant="subtitle2">
                    Sep 14, 2016
                  </Typography>
                  <Typography variant="body2">
                    I'm excited too, let's team up.
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
              <a href="#bob" onClick={(e) => e.preventDefault()}>
                <img src={avatar} alt="..." />
              </a>
            </CardAvatar>
            <CardBody profile>
              <h6 className={classes.cardCategory}>CEO / CO-FOUNDER</h6>
              <h4 className={classes.cardTitle}>Bob</h4>
              <p className={classes.description}>
                Just an virtual person to using as an example.
              </p>
              <Button color="primary" round disabled>
                Follow
              </Button>
            </CardBody>
          </Card>
          <Card profile>
            <CardBody>
              <Wallet
                mode={mode}
                changeMode={changeMode}
                handleFixedClick={handleFixedClick}

                SubWalletInfo={SubWalletInfo}
                BrowserWallet={BrowserWallet}
                ExtensionWallet={ExtensionWallet}

                balance={balance}
                remainBandwidth={remainBandwidth}
                ss58Addr={ss58Addr}
                connectedEvmAddr={connectedEvmAddr}
                bindedEvmAddr={bindedEvmAddr}
                tokenInfo={tokenInfo}
              />
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
                    mnemonic={mnemonic}

                    stakeForBandwidth={mode === PluginType.BrowserWallet ? BrowserWallet.stakeForBandwidth : ExtensionWallet.stakeForBandwidth}
                    unstakeAll={mode === PluginType.BrowserWallet ? BrowserWallet.unstakeAll : ExtensionWallet.unstakeAll}
                    tipUser={mode === PluginType.BrowserWallet ? BrowserWallet.tipUser : ExtensionWallet.tipUser}
                    createToken={mode === PluginType.BrowserWallet ? BrowserWallet.createToken : ExtensionWallet.createToken}
                    tipUserByToken={mode === PluginType.BrowserWallet ? BrowserWallet.tipUserByToken : ExtensionWallet.tipUserByToken}
                    tokenInfo={tokenInfo}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
          <Snackbar
              place="tr"
              color={notificationInfo.color}
              icon={notificationInfo.icon}
              message={notificationInfo.message}
              open={isNotification}
              closeNotification={() => setIsNotification(false)}
              close
          />
        </GridItem>
      </GridContainer>
    </div>
  );
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
