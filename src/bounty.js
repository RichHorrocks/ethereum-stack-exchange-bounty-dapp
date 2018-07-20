import web3 from './web3';
import SEBounty from './contracts/SEBounty.json';

const instance = new web3.eth.Contract(
  JSON.parse(SEBounty.interface),
  '0x81e972553A295E3B1538708Ec161407788f7A1FA'
);

export default instance;
