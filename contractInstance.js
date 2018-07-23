import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import contract from 'truffle-contract';

const SEBountyContract = contract(SEBounty);
SEBountyContract.setProvider(web3.currentProvider);

const instance = SEBountyContract.at('0x195a67b4b7bf41ec8b9f3c9ddb0f4a9f6a315dee');

// 0xa30b7852b1b3cca71907b5148e3e1fb0db1e0c64
// NEWER 0x9b5ca0aac06534a38a2c8509a113a9dd57eebf13
// OLDER 0xda350f2c3356b8dbda3b42130f6893ae8aaadfc7
export default instance;
