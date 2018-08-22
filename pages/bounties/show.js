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
import listenWeb3 from '../../listenWeb3';
import moment from 'moment';
import he from 'he';

class BountyShow extends Component {
  state = {
      isLoading: true,
      errorMessage: '',
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

  static async getInitialProps(props) {
    return {
      bountyId: props.query.id,
    };
  }

  async getQuestionData() {
    // Get the bounty data and set it into state.
    const showBounty = await bounty.bounties.call(this.props.bountyId);
    this.setState({ showBounty });

    // Get the data about the question from Stack Exchange.
    const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${showBounty[1]}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

    //this.setState({ bountyLink: data.data.items[0]})

    /*
     * Get the question title and the link from the returned question.
     * Push them onto each of their respective bounties in the array.
     */
    this.setState({
      bountyTitle: he.decode(data.data.items[0].title),
      bountyLink: data.data.items[0].link,
    });
  }

  async getAnswerData () {
    // Get the array of answers for this bounty.
    const answers = await bounty.getAnswers.call(this.props.bountyId);

    // Get the array of answer owners.
    const answerOwners = await bounty.getAnswerOwners.call(this.props.bountyId);

    // Declare an array for the names of Stack Exchange users.
    let answerNames = [];

    // Get the answers from Stack Exchange.
    if (answers.length > 0) {
      // Get all the question IDs from the bounties.
      const ids = Array(answers.length).fill().map((element, index) => {
        return answers[index].toNumber();
      });

      // Catenate the question IDs.
      const idString = ids.join(';');

      // Get the answers from Stack Exchange in a single request.
      const data = await axios.get(`https://api.stackexchange.com/2.2/answers/${idString}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

    //  const data2 = await axios.get(`https://api.stackexchange.com/2.2/users/${data.data.items[0].owner.user_id}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

      // Get the Stack Exchange display name for each answer.
      data.data.items.map((item, index) => {
        answerNames.push(item.owner.display_name);
      });

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
    // Get the browser users's account details.
    const accounts = await web3.eth.getAccounts();
    this.setState({ userAccount: accounts[0] });
    listenWeb3(accounts[0]);

    // Get the network ID.
    const networkId = await web3.eth.net.getId();
    this.setState({ networkId });

    // Get the question and answer data.
    await this.getQuestionData();
    await this.getAnswerData();
  }

  // Get the bounty's creation timestamp in a user-readable form.
  getTime() {
    return moment(this.state.showBounty[6], "X").fromNow();
  }

  // Render each row in the table of answers.
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

  // Handle the click event when a user posts an answer.
  onSubmit = async (e) => {
    e.preventDefault();
    this.setState({
      isLoading: true,
      errorMessage: '',
    });

    // Call the contract to post the answer.
    try  {
      await bounty.postAnswer(
        this.props.bountyId,
        this.state.newAnswerId,
        { from: this.state.userAccount });

      // Re-render the page with the new answer data.
      await this.getAnswerData();
    } catch (err) {
      this.setState({
        errorMessage: "Are you sure the ID you've used is a valid?" });
    }

    this.setState({ isLoading: false, newAnswerId: '' });
  };

  render() {
    const { Header, Row, HeaderCell, Body } = Table;

    return (
      <Layout>
        <Container>
          <br />
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
                  Posted by {this.state.showBounty[3]} -- {this.getTime()}
                </Item.Extra>
              </Item.Content>
            </Item>
          </Item.Group>
          <Divider />
          <Header
            content="Post a new answer"
            as="h3"
          />
          <Form
            onSubmit={this.onSubmit}
            error={!!this.state.errorMessage}>
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
            <Message
              error
              header="Oops!"
              content={this.state.errorMessage}
            />
          </Form>
          <Message info>
            <li>Go to Stack Exchange</li>
            <li>Either find a suitable answer, or post a new one yourself</li>
            <li>Click the "Share" button below the answer to find the
                answer ID.</li>
            <li>For example, if the URL is
                "https://ethereum.stackexchange.com/a/<strong>1001</strong>/52"
                then the ID is 1001.</li>
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
