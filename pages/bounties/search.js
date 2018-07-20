import React, { Component } from 'react';
import { Form, Button, Input, Message, Container, Card, Segment, Grid, Header } from 'semantic-ui-react';
import Layout from '../../components/Layout';
import { Link, Router } from '../../routes';
import axios from 'axios';

class BountySearch extends Component {
  state = {
    questionId: '',
    errorMessage: '',
    isLoading: false,
    searchText: '',
    pageSize: 1,
    site: 'ethereum',
    method: 'questions',

    sites: [],

    apiUrl: 'https://api.stackexchange.com/2.2/',
    apiKey: 'fMcgqnTvxidY8Sk8n1BcbQ((',
    question: [],
    renderQuestion: false,
  };

  onSubmit = async (e) => {
    e.preventDefault();

    this.setState({ isLoading: true, errorMessage: '' });

    try {
      const data = await axios.get(`${this.state.apiUrl}/${this.state.method}/${this.state.questionId}?pagesize=${this.state.pageSize}&site=${this.state.site}&key=${this.state.apiKey}`);

      this.setState({ question: data.data.items[0] });
      this.setState({ renderQuestion: true });
      console.log(this.state.question);
    } catch (err) {
      this.setState({ errorMessage: err.message });
      console.log(err);
    }

    this.setState({ isLoading: false });
  };

  onNo = () => {
    this.setState({ renderQuestion: false });
  };

  render() {
    return (
      <Layout>
        <div
          style={{ height: '100%' }}>
          <Segment
            vertical
            textAlign='center'
            style={{ height: '100vh' }}>
            <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
              <Grid.Column>
                <Container
                  style={{ height: 300 }}>
                  {this.state.renderQuestion ?
                    <Header
                      textAlign='center'
                      style={{ fontSize: '2.5em' }}
                      size='huge'>
                      We've found the following question!
                    </Header> : (
                    <Header
                      textAlign='center'
                      style={{ fontSize: '2.5em' }}
                      size='huge'>
                      First, find the question you want to place a bounty on
                    </Header>)}
                  {this.state.renderQuestion ? null : (
                    <p
                      style={{ fontSize: '1.2em', lineHeight: 1.6 }}
                      >Use the question ID to search Stack Exchange below.</p>
                  )}
                  {this.state.renderQuestion ? null : (
                    <Form
                      onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
                      <Form.Field>
                        <Input
                          value={this.state.questionId}
                          placeholder='Input question ID...'
                          onChange={e =>
                            this.setState({ questionId: e.target.value })}
                        />
                      </Form.Field>
                      <Message
                        error
                        header="Oops!"
                        content={this.state.errorMessage}
                      />
                      <Button
                        color="green"
                        size="huge"
                        loading={this.state.isLoading}
                      >Find
                      </Button>
                    </Form>
                  )}
                  {this.state.renderQuestion ? (
                    <Card centered>
                      <Card.Content>
                        <a href={this.state.question.link}>
                          <Card.Header>{this.state.question.title}</Card.Header>
                        </a>
                      </Card.Content>
                      <Card.Content extra>
                        Is this the correct question?
                        <Link route="/bounties/new">
                          <a>
                            <Button color='green'>
                              Let's go!
                            </Button>
                          </a>
                        </Link>
                        <Button
                          onClick={this.onNo}>
                          Try again...
                        </Button>
                      </Card.Content>
                    </Card>
                  ) : null }
                </Container>
              </Grid.Column>
            </Grid>
          </Segment>
        </div>
      </Layout>
    );
  }
}

export default BountySearch;
