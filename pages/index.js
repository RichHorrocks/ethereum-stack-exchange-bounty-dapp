import React, { Component } from 'react';
import {
  Button,
  Segment,
  Header,
  Grid,
  Label,
  Icon,
  Image,
} from 'semantic-ui-react';
import Layout from '../components/Layout';
import Status from '../components/Status';
import { Link } from '../routes';
import web3 from '../getWeb3';
import listenWeb3 from '../listenWeb3';

class App extends Component {
  constructor() {
    super();
    this.state = {
      userAccount: '',
      networkId: null,
    };
  }

  async componentDidMount() {
    // Get the active user account.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });
    listenWeb3(accounts[0]);

    // Get the network ID.
    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    //style={{ height: '100vh', backgroundImage: `url('https://gateway.ipfs.io/ipfs/QmNZnBRq6cXauYLYhTeJSRioJCdo3NpbmhnRcWXhLwNEzW')` }}
  }

  render() {
    return (
      <Layout>
        <Segment
          vertical
          inverted
          textAlign='center'
          style={{ height: '100vh'}}>
          <Grid
            textAlign='center'
            style={{ height: '100%' }}
            verticalAlign='middle'>
            <Grid.Column>
              <Header
                textAlign='center'
                inverted
                style={{ fontSize: '3em' }}
                size='huge'>
                Welcome to the Ethereum Stack Exchange Bounty homepage
              </Header>
              <p style={{ fontSize: '1.2em', lineHeight: 1.6 }}>
                Place bounties on questions on Stack Exchange, or earn money by answering other people's questions.
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
              <br />
              <br />
              <Status
                userAccount={this.state.userAccount}
                networkId={this.state.networkId}
              />
              <br />
              <Label pointing>
                <Icon name='mail' /> {this.state.userAccount}
              </Label>
              <br />
              <br />
              <div>
                Main image hosted with
                <Image src='/static/ipfs.png' size="mini" avatar />
              </div>
            </Grid.Column>
          </Grid>
        </Segment>
      </Layout>
    );
  }
}

export default App;
