import React, { Component } from 'react';
import {
  Button,
  Table,
  Container,
  Divider,
  Header,
  Loader,
  Dimmer,
  Form,
  Message,
  Item,
} from 'semantic-ui-react';
import Layout from '../../components/Layout';
import AnswerRow from '../../components/AnswerRow';
import DetailsSteps from '../../components/DetailsSteps';
import Head from '../../components/Head';
import bounty from '../../contractInstance';
import { Link } from '../../routes';
import axios from 'axios';
import web3 from '../../getWeb3';

class BountyShow extends Component {
  state = {
      isLoading: true,
      userAccount: '',
      networkId: null,
      showBounty: {},
      bountyLink: '',
      bountyTitle: '',
      answers: [],
      answerOwners: [],
      answerCount: 0,
      newAnswerId: '',
      acceptedId: 0,
      answerNames: [],
    };

  // Ugh. It was all going so well...
  // truffle-contract doesn't play well with Next.js
  static async getInitialProps(props) {
    return {
      bountyId: props.query.id,
    };
  }

  async getQuestionData() {
    // Get the bounty and set the stage.
    const showBounty = await bounty.bounties.call(this.props.bountyId);
    this.setState({ showBounty });

    // Get the data about the question from Stack Exchange.
    const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${showBounty[1]}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);
console.log(data.data.items[0]);

    //this.setState({ bountyLink: data.data.items[0]})

    // Get the question title and the link from the returned question.
    // Push them onto each of their respective bounties in the array.
    this.setState({
      bountyTitle: data.data.items[0].title,
      bountyLink: data.data.items[0].link,
    });
    console.log(this.state.showBounty);
  }

  async getAnswerData () {
    // Get the array of answers.
    const answers = await bounty.getAnswers.call(this.props.bountyId);

    // Get the array of owners.
    const answerOwners = await bounty.getAnswerOwners.call(this.props.bountyId);

    // Declare an array for the SE names.
    let answerNames = [];

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

      // Get the question title and the link from the returned question.
      // Push them onto each of their respective bounties in the array.
      data.data.items.map((item, index) => {
        answerNames.push(item.owner.display_name);
      });

      // Eh? Think this shouldn't be returning this...
      this.setState({ acceptedId: answers[this.state.showBounty[5]] });
    }

    this.setState({
      answerCount: answers.length,
      answers,
      answerOwners,
      answerNames,
      isLoading: false,
    });
  }

  async componentDidMount() {

    // Get the brower users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });

    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    await this.getQuestionData();
    await this.getAnswerData();
  }

  renderRow() {
    return this.state.answers.map((answer, index) => {
      return <AnswerRow
        key={index}
        answerIndex={index}
        bountyId={this.props.bountyId}
        answerId={answer}
        answerOwner={this.state.answerOwners[index]}
        acceptedId={this.state.acceptedId}
        bountyOwner={this.state.showBounty[3]}
        answerName={this.state.answerNames[index]}
        userAccount={this.state.userAccount}
        bountyStage={this.state.showBounty[4].toNumber()}
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

    await this.getAnswerData();

    this.setState({ isLoading: false, newAnswerId: '' });
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
            stage={this.state.showBounty[4]}
          />
          <Divider />
          <Item.Group>
            <Item>
              <Item.Content>
                <Item.Header as='a' href={this.state.bountyLink}>
                  {this.state.bountyTitle}
                </Item.Header>
                <Item.Description>
                  {this.state.showBounty[0]}
                </Item.Description>
                <Item.Extra>
                  Posted by {this.state.showBounty[3]}
                </Item.Extra>
              </Item.Content>
            </Item>
          </Item.Group>
          <Divider />
          <Header
            content="Post a new answer"
            as="h3"
          />
          <Form onSubmit={this.onSubmit}>
            <Form.Group>
              <Form.Input
                placeholder='Answer ID'
                value={this.state.newAnswerId}
                onChange={e =>
                  this.setState({ newAnswerId: e.target.value })}/>
              <Form.Button
                disabled={this.state.bountyStage > 0}
                content='Submit'
                color='green'
                loading={this.state.isLoading} />
            </Form.Group>
          </Form>
          <Message info>
            <Message.Header>Remember</Message.Header>
            <p>
              You can only post one answer per bounty. If you want to add a different answer, you must cancel the other one first.
            </p>
          </Message>
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
