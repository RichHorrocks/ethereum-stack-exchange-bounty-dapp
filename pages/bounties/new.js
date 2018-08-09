import React, { Component } from 'react';
import { Form, Input, TextArea, Dropdown, Button,  Message, Container, Card, Segment, Grid, Header, Dimmer, Loader } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import Head from '../../components/Head';
import { Link, Router } from '../../routes';
import axios from 'axios';
import web3 from '../../getWeb3';
import listenWeb3 from '../../listenWeb3';
import bounty from '../../contractInstance';
import he from 'he';

import Web3 from 'web3';
import SEBounty from '../../build/contracts/SEBounty.json';
import contract from 'truffle-contract';

class BountySearch2 extends Component {
  constructor() {
    super();
    this.state = {
      questionId: '',
      errorMessage: '',
      bountyValue: '',
      bountyUnits: 'ether',
      bountyDescription: '',
      isLoading: false,
      loaderContent: '',
      question: [],
      renderQuestion: false,
      userAccount: '',
      networkId: null,
      tokens: [],
      questionTitle: '',
    };
  }

  onFind = async (e) => {
    e.preventDefault();
    this.setState({
      isLoading: true,
      renderQuestion: false,
      errorMessage: '',
    });

    if (this.state.questionId == '') {
      this.setState({ errorMessage: 'Please enter a question ID' });
    } else {
      try {
        const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${this.state.questionId}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

        const questionTitle = he.decode(data.data.items[0].title);
        this.setState({
          question: data.data.items[0],
          questionTitle,
          renderQuestion: true
        });
      } catch (err) {
        this.setState({ errorMessage: err.message });
      }
    }

    this.setState({ isLoading: false });
  };

  onPost = async () => {
    this.setState({
      isLoading: true,
      errorMessage: '',
    });

    if (this.state.questionId == '') {
      this.setState({ errorMessage: 'Please enter a question ID' });
    } else if (this.state.bountyValue == 0) {
      this.setState({ errorMessage: 'Please enter a value for your bounty' });
    } else {
      try {
        // Define an event we'll be watching for later on.
        //var bountyOpenedEvent = bounty.events.BountyOpened();
        this.setState({ loaderContent: 'Preparing bounty...' });

        // Call into the contract to create the bounty.
        // This runs oraclize_query() to check that our question ID is valid.
        await bounty.postBounty(
          this.state.bountyDescription,
          this.state.questionId,
          { from: this.state.userAccount,
            value: web3.utils.toWei(this.state.bountyValue, this.state.bountyUnits),
          });

        // Wait for the __callback() function to be called in the contract.
        // This emits a log that we can check for. (BountyOpened)
        this.setState({
          loaderContent:
          'Checking with Stack Exchange. This might take a minute...',
        });

        // Metamask doesn't support events in web3@1.0.0... :-|
        // How is this?
        const web3Infura = new Web3(new Web3.providers.WebsocketProvider('wss://rinkeby.infura.io/_ws'));

        var bountyEvents = new web3Infura.eth.Contract(SEBounty.abi, '0xf0bf634d51292e9c580c74add0b2828c9da8d680');

        // contract.allEvents({
        //     fromBlock: 'latest',
        // }, function (error, event) {
        //     if (error)
        //         alert("error while subscribing to event")
        //     console.log(event)
        //     }
        // })
        //https://ethereum.stackexchange.com/questions/42800/react-incorporating-event-listening-into-web3js-promise

        bountyEvents.events.OraclizeQuerySuccess({}, (err, result) => {
          if (!err) {
            console.log("LOGGED -- " + result);
            Router.pushRoute('/bounties/explore');
          } else {
            this.setState({ errorMessage: err.message, isLoading: false });
          }
        });

        bountyEvents.events.OraclizeQueryFail({}, (err, result) => {
          this.setState({
            errorMessage: "Unable to confirm request with Stack Exchange", isLoading: false
          });
        });


      } catch (err) {
        this.setState({ errorMessage: err.message, loaderContent: '' });
      }
    }


  };

  async componentDidMount() {
    // Get the brower users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });
    listenWeb3(accounts[0]);

    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    axios
    .get('https://raw.githubusercontent.com/kvhnuke/etherwallet/mercury/app/scripts/tokens/ethTokens.json')
    .then(({ data }) => {
      const newData = data.map(({ address, symbol, decimal, type }) => ({ value: address, text: symbol }));
      this.setState({ tokens: newData });
    })
    .catch((err) => {
      console.log(err);
    });
  }

  render() {
    const valueOptions = [
      { key: 'wei', text: 'wei', value: 'wei' },
      { key: 'gwei', text: 'gwei', value: 'gwei' },
      { key: 'finney', text: 'finney', value: 'finney' },
      { key: 'ether', text: 'ether', value: 'ether' },
    ];

    return (
      <Layout>
        <Container>
          <Head
            title="Post a Bounty"
            type="new"
            userAccount={this.state.userAccount}
            networkId={this.state.networkId}
          />
          <Dimmer.Dimmable active>
            <Dimmer active={this.state.isLoading} inverted>
              <Loader
                inverted
                size="massive"
                content={this.state.loaderContent} />
            </Dimmer>
            <Grid columns={3}>
              <Grid.Row>
                <Grid.Column>
                  Find the question on Stack Exchange
                </Grid.Column>
                <Grid.Column>
                <Form
                  onSubmit={this.onFind}
                  error={!!this.state.errorMessage}>
                  <Form.Field>
                    <Form.Input
                      placeholder='Question ID'
                      value={this.state.questionId}
                      onChange={e =>
                        this.setState({ questionId: e.target.value })}/>
                  </Form.Field>
                  {this.state.renderQuestion ? (
                  <Card>
                    <Card.Content>
                      <Card.Meta>
                        We found the following question:
                      </Card.Meta>
                      <Card.Description>
                        <a href={this.state.question.link}>
                          {this.state.questionTitle}
                        </a>
                      </Card.Description>
                    </Card.Content>
                  </Card>
                ) : null }
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
                      <Input
                        label={
                          <Dropdown
                            value={this.state.bountyUnits}
                            options={valueOptions}
                            onChange={(e, { value }) =>
                              this.setState({ bountyUnits: value })}
                          />
                        }
                        labelPosition="right"
                        placeholder='Bounty Value'
                        value={this.state.bountyValue}
                        onChange={e =>
                          this.setState({ bountyValue: e.target.value })}
                        />
                    </Form.Field>
                  </Form>
              {/*    <p>OR</p>
                  <Dropdown
                    placeholder='Search for an ERC-20 token here...'
                    selection
                    search
                    options={this.state.tokens}
                  /> */}
                </Grid.Column>
                <Grid.Column>
                  <Message info>
                    <p>This Dapp uses Oraclize to query Stack Exchange. A small surcharge is added to the value of your bounty to cover the Oraclize fee.</p>
                  </Message>
                </Grid.Column>
              </Grid.Row>

              <Grid.Row>
                <Grid.Column>
                  Describe any instructions for the bounty hunters
                </Grid.Column>
                <Grid.Column>
                  <Form
                    error={!!this.state.errorMessage}>
                    <Form.Field>
                      <Form.TextArea
                        placeholder='Instructions for your bounty...'
                        value={this.state.bountyDescription}
                        onChange={e =>
                          this.setState({ bountyDescription: e.target.value })}
                        />
                    </Form.Field>
                    <Message
                      error
                      header="Oops!"
                      content={this.state.errorMessage}
                    />
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
                    content='Post Bounty'
                    color='green'
                    size='huge'
                    onClick={this.onPost}
                    loading={this.state.isLoading}
                  />
                </Grid.Column>
                <Grid.Column>
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </Dimmer.Dimmable>
        </Container>
      </Layout>
    );
  }
}

export default BountySearch2;
