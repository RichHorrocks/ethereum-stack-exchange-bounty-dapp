import React, { Component } from 'react';
import { Form, Button, Input, Message, Container, Card, Segment, Grid, Header } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Head from '../../components/Head';
import { Link, Router } from '../../routes';
import axios from 'axios';
import web3 from '../../getWeb3';
import bounty from '../../contractInstance';

class BountySearch2 extends Component {
  constructor() {
    super();
    this.state = {
      questionId: '',
      errorMessage: '',
      bountyValue: '',
      bountyDescription: '',
      isLoading: false,
      question: [],
      renderQuestion: false,
      userAccount: '',
      networkId: 4, // Default to Rinkeby, but check later anyway.
    };
  }

  onSubmit = async (e) => {
    e.preventDefault();
    this.setState({ isLoading: true, errorMessage: '' });

    try {
      const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${this.state.questionId}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

      this.setState({ question: data.data.items[0] });
      this.setState({ renderQuestion: true });
    } catch (err) {
      this.setState({ errorMessage: err.message });
      console.log(err);
    }

    this.setState({ isLoading: false });
  };

  handleClick = async () => {
    this.setState({ isLoading: true, errorMessage: '' });

    try {
      await bounty.createBounty(
        this.state.bountyDescription,
        this.state.questionId,
        { from: this.state.userAccount,
          value: this.state.bountyValue,
        });

      Router.pushRoute('/bounties/explore');
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }

    this.setState({ isLoading: false });
  };

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
            title="Post a Bounty"
            type="new"
            userAccount={this.state.userAccount}
            networkId={this.state.networkId}
          />
          <Grid columns={3}>
            <Grid.Row>
              <Grid.Column>
                Find the question on Stack Exchange
              </Grid.Column>
              <Grid.Column>
              <Form
                onSubmit={this.onSubmit}
                error={!!this.state.errorMessage}>
                <Form.Field>
                  <input
                    placeholder='Question ID'
                    value={this.state.questionId}
                    onChange={e =>
                      this.setState({ questionId: e.target.value })}/>
                </Form.Field>
                <Button
                  content="Find"
                  color="green"
                  loading={this.state.isLoading}
                />
              </Form>
              </Grid.Column>
              <Grid.Column>
                <Message info>
                  <li>Go to Stack Exchange</li>
                  <li>Look at the URL to get the question ID</li>
                </Message>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                Enter the bounty amount
              </Grid.Column>
              <Grid.Column>
                <Form>
                  <Form.Field>
                    <input
                      placeholder='Bounty Value'
                      value={this.state.bountyValue}
                      onChange={e =>
                        this.setState({ bountyValue: e.target.value })}
                      />
                  </Form.Field>
                </Form>
              </Grid.Column>
              <Grid.Column>
                <Message info>
                  <p>The default unit for bounties is wei</p>
                </Message>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
                Describe any instructions for the bounty hunters
              </Grid.Column>
              <Grid.Column>
                <Form>
                  <Form.Field>
                    <Form.TextArea
                      placeholder='Instructions for your bounty...'
                      value={this.state.bountyDescription}
                      onChange={e =>
                        this.setState({ bountyDescription: e.target.value })}
                      />
                  </Form.Field>
                </Form>
              </Grid.Column>
              <Grid.Column>
                <Message info>
                  <p>Try to keep it short! The longer your description, the more it'll cost in network fees.</p>
                </Message>
              </Grid.Column>
            </Grid.Row>

            <Grid.Row>
              <Grid.Column>
              </Grid.Column>
              <Grid.Column textAlign='center'>
                <Button
                  content="Do that bounty!"
                  color='green'
                  size='huge'
                  onClick={this.handleClick}
                  loading={this.state.isLoading}
                />
              </Grid.Column>
              <Grid.Column>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
      </Layout>
    );
  }
}

export default BountySearch2;
