import React, { Component } from 'react';
import { Button, Container, Segment, Header } from 'semantic-ui-react';
import Layout from './components/Layout';

class App extends Component {

  render() {
    return (
      //<Layout>
        <div>
          <link
            rel="stylesheet"
            href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.1/semantic.min.css"></link>
          <Segment
            vertical
            inverted
            textAlign='center'
            style={{ height: '100vh' }}>
          <Container
            text='true'
            inverted
            style={{ height: 300 }}>
            <Header
              inverted
              size='huge'
              style={{ fontSize: '2em' }}>Welcome to the Ethereum Stack Exchange Bounty homepage.</Header>
            <p
              style={{ fontSize: '1.2em', lineHeight: 1.6 }}>Place bounties on your question on Stack Exchange, or earn money by answering other people's questions.</p>
            <Button
              content="Post a Bounty"
              color="green"
              size="huge"
            />
            <Button
              content="Open Bounties"
              color="teal"
              size="huge"
            />
            <Button
              content="My Dashboard"
              size="huge"
            />
          </Container>
          </Segment>
        </div>
    //  </Layout>
    );
  }
}

export default App;
