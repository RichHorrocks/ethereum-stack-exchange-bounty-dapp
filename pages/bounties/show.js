import React, { Component } from 'react';
import {
  Button,
  Table,
  Container,
  Divider,
  Header,
  Loader,
  Dimmer,
  Step,
  Icon,
  Form,
  Message,
} from 'semantic-ui-react';
import Layout from '../../components/Layout';
import AnswerRow from '../../components/AnswerRow';
import DetailsSteps from '../../components/DetailsSteps';
import Head from '../../components/Head';
import bounty from '../../contractInstance';
import { Link, Router } from '../../routes';
import axios from 'axios';
import web3 from '../../getWeb3';

class BountyShow extends Component {
  state = {
      isLoading: true,
      showBounty: {},
      answerCount: 0,
      newAnswerId: 0,
      acceptedId: 0,
      answers: [],
      answerOwners: [],
      userAccount: '',
      networkId: 4, // Default to Rinkeby, but check later anyway.
      stage: 0,
    };

  // Ugh. It was all going so well...
  // truffle-contract doesn't play well with Next.js
  static async getInitialProps(props) {
    return {
      bountyId: props.query.id,
    };
  }

  async componentDidMount() {

    // Get the brower users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });

    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    // Get the bounty and set the stage.
    const showBounty = await bounty.bounties.call(this.props.bountyId);
    this.setState({ stage: showBounty[4].toNumber() });

    // Get the array of answers.
    const answers = await bounty.getAnswers.call(this.props.bountyId);
    let answerOwners = [];

    // Get the answers from Stack Exchange.
    if (answers.length > 0) {
      // Get all the question IDs from the bounties.
      const ids = Array(answers.length).fill().map((element, index) => {
        return answers[index].toNumber();
      });

      // Catenate the question IDs.
      const idString = ids.join(';');

      // Get the questions from Stack Exchange in a single request.
      const data = await axios.get(`https://api.stackexchange.com/2.2/answers/${idString}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);
      console.log(data);

      // Get the question title and the link from the returned question.
      // Push them onto each of their respective bounties in the array.
      data.data.items.map((item, index) => {
        answerOwners.push(item.owner.display_name);
      });

      // Eh? Think this shouldn't be returning this...
      this.setState({ acceptedId: answers[showBounty[5]] });
    }

    this.setState({
      answerCount: answers.length,
      answers,
      answerOwners,
      isLoading: false,
    });
  }

  renderRow() {
    return this.state.answers.map((answer, index) => {
      return <AnswerRow
        key={index}
        answerIndex={index}
        bountyId={this.props.bountyId}
        answerId={answer}
        acceptedId={this.state.acceptedId}
        owner={this.state.answerOwners[index]}
        userAccount={this.state.userAccount}
      />;
    });
  }

  onSubmit = async (e) => {
    e.preventDefault();
    this.setState({ isLoading: true });

    await bounty.postAnswer(
      this.props.bountyId,
      this.state.newAnswerId,
      { from: this.state.userAccount });

    this.setState({ isLoading: false });
  };

  render() {
    const { Header, Row, HeaderCell, Body } = Table;

    return (
      <Layout>
        <Container>
          <Head
            title="Bounty Details"
            userAccount={this.state.userAccount}
            networkId={this.state.networkId}
          />
          <DetailsSteps
            stage={this.state.stage}
          />

          <Divider />
            <Header
              content="Post a new answer"
              as="h3"
            />
          <Form onSubmit={this.onSubmit}>
            <Form.Group>
              <Form.Input
                placeholder='Answer ID'
                value={this.state.answerId}
                onChange={e =>
                  this.setState({ answerId: e.target.value })}/>
              <Form.Button
                content='Submit'
                color='green'
                loading={this.state.isLoading} />
            </Form.Group>

          </Form>
          <Message info header='Form Completed' content="You're all signed up for the newsletter" />

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
                {this.renderRow()}
              </Body>
            </Table>
          </Dimmer.Dimmable>
          Found {this.state.answerCount} answers.
        </Container>
      </Layout>
    );
  }
}

export default BountyShow;
