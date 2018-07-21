import React, { Component } from 'react';
import { Form, Button, Input, Message, Container, Card, Segment, Grid, Header, Image, Dimmer, Loader, Table, Divider } from 'semantic-ui-react';
import Layout from '../components/Layout';
import Head from '../components/Head';
import { Link, Router } from '../routes';
import axios from 'axios';
import web3 from '../getWeb3';
import bounty from '../contractInstance';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      userAccount: '',
      networkId: 4, // Default to Rinkeby, but check later anyway.
      userBounties: [],
      bountyCount: 0,
      userAnswers: [],
      answerCount: 0,
    };
  }

  async componentDidMount() {
    // Get the brower users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });

    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    // Get all bounties from the contract.
    let bountyCount = await bounty.getBountyCount.call();
    bountyCount = bountyCount.toNumber();

    // Get all the bounties from the contract.
    const bounties = await Promise.all(
      Array(bountyCount).fill().map((element, index) => {
        return bounty.bounties.call(index);
      })
    );

    // Iterate through the bounties:
    //  - keep those belonging to this user
    //  - get the list of answer owners
    //    - if there are any belonging to this user, get the associated
    //      question ID
    let userBounties = [];
    let userAnswers = [];
    for (var i = 0; i < bountyCount; i++) {
      if (bounties[i][3].toUpperCase() == accounts[0].toUpperCase()) {
        userBounties.push(bounties[i])
      }

      const answers = await bounty.getAnswers.call(i);
      const answerOwners = await bounty.getAnswerOwners.call(i);

      for (var j = 0; j < answerOwners.length; j++) {
        if (answerOwners[j].toUpperCase() == accounts[0].toUpperCase())
            userAnswers.push(answers[j]);
      }
    }

    this.setState({
      userBounties,
      userAnswers,
      bountyCount: userBounties.length,
      answerCount: userAnswers.length,
      isLoading: false,
    });
  }

  render() {
    const { Header, Row, HeaderCell, Body } = Table;

    return (
      <Layout>
        <Container>
          <Head
            title="Your Dashboard"
            type="dashboard"
            userAccount={this.state.userAccount}
            networkId={this.state.networkId}
          />
          <Dimmer.Dimmable active>
            <Dimmer active={this.state.isLoading} inverted>
              <Loader inverted></Loader>
            </Dimmer>
            <Table>
              <Header>
                <Row>
                  <HeaderCell>ID and Link</HeaderCell>
                  <HeaderCell>Answer Owner</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </Row>
              </Header>
              <Body>
              </Body>
            </Table>
          </Dimmer.Dimmable>

          Found {this.state.bountyCount} bounties.
          <Divider />
          <Dimmer.Dimmable active>
            <Dimmer active={this.state.isLoading} inverted>
              <Loader inverted></Loader>
            </Dimmer>
            <Table>
              <Header>
                <Row>
                  <HeaderCell>ID and Link</HeaderCell>
                  <HeaderCell>Answer Owner</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </Row>
              </Header>
              <Body>

              </Body>
            </Table>
          </Dimmer.Dimmable>
          Found {this.state.answerCount} answers.
        </Container>
      </Layout>
    );
  }
}

export default Dashboard;
