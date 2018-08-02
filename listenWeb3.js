import web3 from './getWeb3';

export default function listenWeb3(userAccount) {
  web3.currentProvider.publicConfigStore.on('update', ({ selectedAddress }) => {
    if (selectedAddress.toUpperCase() != userAccount.toUpperCase()) {
      console.log("ACCOUNT CHANGED -- From: " + userAccount + " -- To: " + selectedAddress);
      location.reload();
    }
  });
}
