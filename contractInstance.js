import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import contract from 'truffle-contract';

const SEBountyContract = contract(SEBounty);
SEBountyContract.setProvider(web3.currentProvider);

const instance =
  SEBountyContract.at('0x673dbc9af7df9f5cdff18d96c464805b7a21e922');

export default instance;
