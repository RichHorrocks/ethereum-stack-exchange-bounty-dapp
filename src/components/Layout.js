import React from 'react';

export default (props) => {
  return (
    <div>
      <link
        rel="stylesheet"
        href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.1/semantic.min.css"></link>
        <title>Ethereum Stack Exchange Bounty</title>
      {props.children}
    </div>
  );
};
