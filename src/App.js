import React, { Component } from 'react';
import {
  Button,
  Container,
  Segment,
  Header,
  Grid
} from 'semantic-ui-react';
import Layout from './components/Layout';

class App extends Component {
  render() {
    return (
      <Layout>
        <div
          style={{ height: '100%' }}>
          <Segment
            vertical
            inverted
            textAlign='center'
            style={{ height: '100vh' }}>
            <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
              <Grid.Column>
                <Container
                  style={{ height: 300 }}>
                  <Header
                    textAlign='center'
                    inverted
                    style={{ fontSize: '2.5em' }}
                    size='huge'>
                    Welcome to the Ethereum Stack Exchange Bounty homepage
                  </Header>
                  <p
                    style={{ fontSize: '1.2em', lineHeight: 1.6 }}
                    >Place bounties on question on Stack Exchange, or earn money by answering other people's questions.</p>
                  <Button
                    content="Post a Bounty"
                    size="huge"
                  />
                  <Button
                    content="Explore Bounties"
                    size="huge"
                  />
                  <Button
                    content="My Dashboard"
                    size="huge"
                  />
                </Container>
              </Grid.Column>
            </Grid>
          </Segment>
        </div>
      </Layout>
    );
  }
}

export default App;
