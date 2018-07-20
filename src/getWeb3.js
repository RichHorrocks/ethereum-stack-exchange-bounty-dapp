import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
  // We are in the browser and Metamask is running.
  // Use MM's provider and create our instance of web3.
  web3 = new Web3(window.web3.currentProvider);
  console.log("Using MM");
} else {
  // We are on the server, or the user isn't running MM.
  const provider = new Web3.providers.HttpProvider(
    'https://rinkeby.infura.io/JKWwDa2UBGnU0gjLB0Wm'
  );
  web3 = new Web3(provider);
  console.log("Using Infura");
}

export default web3;
