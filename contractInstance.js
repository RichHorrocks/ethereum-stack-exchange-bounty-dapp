import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import contract from 'truffle-contract';

const SEBountyContract = contract(SEBounty);
SEBountyContract.setProvider(web3.currentProvider);

const instance =
  SEBountyContract.at('0x2b451aabc6bebd06f394987fc011ac502a393f70');

export default instance;
