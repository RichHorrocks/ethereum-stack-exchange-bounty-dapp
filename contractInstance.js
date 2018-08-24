import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import contract from 'truffle-contract';

const SEBountyContract = contract(SEBounty);
SEBountyContract.setProvider(web3.currentProvider);

const instance =
  SEBountyContract.at('0x23a9f2c849996bb5f601a2028d7feed4481382e5');

export default instance;

// Deployed to Rinkeby, waiting for Oraclize callbacks...
//0x673dbc9af7df9f5cdff18d96c464805b7a21e922

// Old one... same problem
// 0x7aa894e542d36d8c6245d97bfdcc840dfc0a3572
