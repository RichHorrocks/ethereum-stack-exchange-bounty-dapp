import React from 'react';
import { Container } from 'semantic-ui-react';
import Head from 'next/head';

export default (props) => {
  return (
    <div>
      <Head>
        <title>Ethereum Stack Exchange Bounty</title>
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.1/semantic.min.css"></link>
      </Head>
      {props.children}
    </div>
  );
};
