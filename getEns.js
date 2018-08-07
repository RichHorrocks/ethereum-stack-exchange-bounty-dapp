import web3 from './getWeb3';
import ENS from 'ethereum-ens';

const ens = new ENS(web3.currentProvider);

export default ens;
