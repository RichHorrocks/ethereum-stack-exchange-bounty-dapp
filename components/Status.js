import 'babel-polyfill';
import React from 'react';
import NetworkStatus from 'react-web3-network-status/stateless';

const Status = (props) => (
  <div>
  <NetworkStatus
    networkId={props.networkId}
    address={props.userAccount}
  />
  </div>
);

export default Status;
