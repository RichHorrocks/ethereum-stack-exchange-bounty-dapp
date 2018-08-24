import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import Web3 from 'web3';

/*
 * This project is using web3@1.0.0.
 * Metamask doesn't support events in web3@1.0.0, so we need to use
 * a provider that does. Connect to Infura's websocket and listen for
 * events there.
 */
const web3Infura = new Web3(
  new Web3.providers.WebsocketProvider(
  'wss://rinkeby.infura.io/_ws'));

const SEBountyEventsContract = new web3Infura.eth.Contract(
  SEBounty.abi,
  '0x23a9f2c849996bb5f601a2028d7feed4481382e5');

export default SEBountyEventsContract;


// Deployed to Rinkeby, waiting for Oraclize callbacks...
//0x673dbc9af7df9f5cdff18d96c464805b7a21e922

// Old one... same problem
// 0x7aa894e542d36d8c6245d97bfdcc840dfc0a3572
