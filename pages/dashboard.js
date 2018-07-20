import React, { Component } from 'react';
import { Form, Button, Input, Message, Container, Card, Segment, Grid, Header, Image } from 'semantic-ui-react';
import Layout from '../components/Layout';
import Head from '../components/Head';
import { Link, Router } from '../routes';
import axios from 'axios';
import web3 from '../getWeb3';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      userAccount: '',
      networkId: 4, // Default to Rinkeby, but check later anyway.
    };
  }

  async componentDidMount() {
    // Get the brower users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });

    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });
  }

  render() {
    return (
      <Layout>
        <Container>
          <Head
            title="Your Dashboard"
            type="dashboard"
            userAccount={this.state.userAccount}
            networkId={this.state.networkId}
          />
        </Container>
      </Layout>
    );
  }
}

export default Dashboard;
