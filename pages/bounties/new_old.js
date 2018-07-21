import React, { Component } from 'react';
import { Form, Button, Input, Message, Container, Card, Segment, Grid, Header, Image } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import { Link, Router } from '../../routes';
import web3 from '../../getWeb3';
import bounty from '../../contractInstance';

class BountyNew extends Component {
  state = {
    bountyValue: '',
    bountyDescription: '',
    errorMessage: '',
    isLoading: false,
    question: [],
  };

  onSubmit = async (e) => {
    e.preventDefault();

    this.setState({ isLoading: true, errorMessage: '' });

    try {
      const accounts = await web3.eth.getAccounts();

      //const example = await bounty.bounties.call(0);

      await bounty.createBounty(
        this.state.bountyDescription,
        21098,
        { from: accounts[0],
          value: this.state.bountyValue,
        });

      const example = await bounty.bounties.call(0);
      console.log(example);

      //Router.pushRoute('/dashboard');
    } catch (err) {
      this.setState({ errorMessage: err.message });
    }

    this.setState({ isLoading: false });
  };

  render() {
    return (
      <Layout>
        <div
          style={{ height: '100%' }}>
          <Segment
            vertical
            style={{ height: '100vh' }}>
          <Grid
            textAlign='center'
            style={{ height: '100%' }}
            verticalAlign='middle'>
            <Grid.Column style={{ maxWidth: 450 }}>
              <Header as='h2' textAlign='center'>
                Place your bounty!
              </Header>
              <Form
                onSubmit={this.onSubmit}
                size='large'
                loading={this.state.isLoading}
                error={!!this.state.errorMessage}>
                <Form.Field>
                  <Input
                    label="wei"
                    labelPosition="right"
                    placeholder='Bounty in wei...'
                    value={this.state.bountyValue}
                    onChange={e =>
                this.setState({ bountyValue: e.target.value })}
                  />
                </Form.Field>
                OR
                <Form.TextArea
                  placeholder='Instructions for your bounty...'
                  value={this.state.bountyDescription}
                  onChange={e =>
              this.setState({ bountyDescription: e.target.value })}
                />



                <Button color='green' size='large'>
                  Do that bounty!
                </Button>
              </Form>
              {this.state.errorMessage ?
              <Message
                error
                header="Oops!"
                content={this.state.errorMessage}
              /> :
              <Message info>
                <Message.Header>Remember:</Message.Header>
                <ul>
                  <li>Bounties are placed in wei</li>
                  <li>The longer your description, the more your bounty will cost to create</li>
                  <li>You can cancel your bounty if you make a mistake, but you will need to pay the network fees (gas costs)!</li>
                </ul>
              </Message>}
            </Grid.Column>
          </Grid>
        </Segment>
        </div>
      </Layout>
    );
  }
}

export default BountyNew;
