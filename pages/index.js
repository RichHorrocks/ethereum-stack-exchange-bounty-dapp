import React, { Component } from 'react';
import {
  Button,
  Container,
  Segment,
  Header,
  Grid
} from 'semantic-ui-react';
import Layout from '../components/Layout';
import Status from '../components/Status';
import { Link } from '../routes';

class App extends Component {
  render() {
    return (
      <Layout>
        <Segment
          vertical
          inverted
          textAlign='center'
          style={{ height: '100vh' }}>
          <Grid
            textAlign='center'
            style={{ height: '100%' }}
            verticalAlign='middle'>
            <Grid.Column style={{ height: 300 }}>
              <Header
                textAlign='center'
                inverted
                style={{ fontSize: '2.5em' }}
                size='huge'>
                Welcome to the Ethereum Stack Exchange Bounty homepage
              </Header>
              <p style={{ fontSize: '1.2em', lineHeight: 1.6 }}>
                Place bounties on your questions on Stack Exchange, or earn money by answering other people's questions.
              </p>
              <p style={{ fontSize: '1.2em', lineHeight: 1.6 }}>
                Bounties can be placed in ETH or any ERC-20 token.
              </p>
              <Link route="/bounties/new">
                <a>
                  <Button
                    content="Post a Bounty"
                    color="green"
                    size="huge"
                  />
                </a>
              </Link>
              <Link route="/bounties/explore">
                <a>
                  <Button
                    content="Explore Bounties"
                    color="teal"
                    size="huge"
                  />
                </a>
              </Link>
              <Link route="/dashboard">
                <Button
                  content="My Dashboard"
                  color="violet"
                  size="huge"
                />
              </Link>
            </Grid.Column>
          </Grid>
          <Status />
        </Segment>
      </Layout>
    );
  }
}

export default App;
