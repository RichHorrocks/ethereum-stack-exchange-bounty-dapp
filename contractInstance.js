import web3 from './getWeb3';
import SEBounty from './build/contracts/SEBounty.json';
import contract from 'truffle-contract';

const SEBountyContract = contract(SEBounty);
SEBountyContract.setProvider(web3.currentProvider);

const instance = SEBountyContract.at('0xa97fbfd9469f93cd5b59e808f95e03c6bf66a3a8');


// 0xb5ff4191111c21d4cf9108fe67c27d0c804d91c0
//  Added Oraclize after here.
// 0xf0bf634d51292e9c580c74add0b2828c9da8d680
// 0x6d2b673ff4a1598c1d5fb739aa5cc231cc8df7cb
// 0x195a67b4b7bf41ec8b9f3c9ddb0f4a9f6a315dee
// 0xa30b7852b1b3cca71907b5148e3e1fb0db1e0c64
// NEWER 0x9b5ca0aac06534a38a2c8509a113a9dd57eebf13
// OLDER 0xda350f2c3356b8dbda3b42130f6893ae8aaadfc7
export default instance;
