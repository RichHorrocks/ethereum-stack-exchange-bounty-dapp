import React, { Component } from 'react';
import {
  Container,
  Header,
  Dimmer,
  Loader,
  Table,
  Divider,
} from 'semantic-ui-react';
import Layout from '../components/Layout';
import Head from '../components/Head';
import { Link } from '../routes';
import axios from 'axios';
import web3 from '../getWeb3';
import bounty from '../contractInstance';
import QuestionRow from '../components/QuestionRow';
import DashboardRow from '../components/DashboardRow';

class Dashboard extends Component {
  constructor() {
    super();
    this.state = {
      isLoading: true,
      userAccount: '',
      networkId: null,
      bountyCount: 0,
      userBounties: [],
      answerBounties: [],
      userAnswers: [],
      answerCount: 0,
      userBountyCount: 0,
      userAwardedTotal: 0,
      userAnswerCount: 0,
      userAcceptedCount: 0,
      userWonTotal: 0,
    };
  }

  async componentDidMount() {
    console.log(web3);
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
    let answerBounties = [];
    for (var i = 0; i < bountyCount; i++) {
      if (bounties[i][3].toUpperCase() == accounts[0].toUpperCase()) {
        userBounties.push(JSON.parse(JSON.stringify(bounties[i])));
      }

      const answers = await bounty.getAnswers.call(i);
      const answerOwners = await bounty.getAnswerOwners.call(i);

      for (var j = 0; j < answers.length; j++) {
        if (answerOwners[j].toUpperCase() == accounts[0].toUpperCase()) {
          userAnswers.push(JSON.parse(JSON.stringify(answers[j])));
          answerBounties.push(JSON.parse(JSON.stringify(bounties[i])));

          answerBounties[answerBounties.length - 1].push(JSON.parse(JSON.stringify(answers[bounties[i][5]])));

        }
      }
    }

    if (userBounties.length > 0) {
      // Get all the question IDs from the bounties.
      const ids = Array(userBounties.length).fill().map((element, index) => {
        return userBounties[index][1];
      });

      // Catenate the question IDs.
      const idString = ids.join(';');

      // Get the questions from Stack Exchange in a single request.
      const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${idString}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

      // Get the question title and the link from the returned question.
      // Push them onto each of their respective bounties in the array.
    //  data.data.items.map((item, index) => {
    //    userBounties[index].push(item.link);
    //    userBounties[index].push(item.title);
    //  });

      // It's possible multiple bounties are open for the same question ID.
      // Iterate through all the bounties... Is there a better way than this?
      data.data.items.map((item, index) => {
        for (var i = 0; i < bountyCount; i++) {
          if (userBounties[i][1] == item.question_id) {
            userBounties[i].push(item.link);
            userBounties[i].push(item.title);
          }
        }
      });
    }

    if (answerBounties.length > 0) {
      // Get all the question IDs from the bounties.
      const ids = Array(answerBounties.length).fill().map((element, index) => {
        return answerBounties[index][1];
      });

      // Catenate the question IDs.
      const idString = ids.join(';');

      // Get the questions from Stack Exchange in a single request.
      const data = await axios.get(`https://api.stackexchange.com/2.2/questions/${idString}?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ((`);

      // Get the question title and the link from the returned question.
      // Push them onto each of their respective bounties in the array.
      data.data.items.map((item, index) => {
        answerBounties[index].push(item.link);
        answerBounties[index].push(item.title);
      });
    }

    // Get overall totals.
    const userBountyCount = await bounty.bountyCount.call(accounts[0]);
    const userAwardedTotal = await bounty.awardedTotal.call(accounts[0]);
    const userAnswerCount = await bounty.answerCount.call(accounts[0]);
    const userAcceptedCount = await bounty.acceptedCount.call(accounts[0]);
    const userWonTotal = await bounty.wonTotal.call(accounts[0]);

    this.setState({
      userBounties,
      userAnswers,
      answerBounties,
      bountyCount: userBounties.length,
      answerCount: userAnswers.length,
      isLoading: false,
      userBountyCount,
      userAwardedTotal,
      userAnswerCount,
      userAcceptedCount,
      userWonTotal,
    });
  }

  renderBountyRow() {
    return this.state.userBounties.map((bounty, index) => {
      return <QuestionRow
        key={index}
        id={index}
        bounty={bounty}
        userAccount={this.state.userAccount}
      />;
    });
  }

  renderAanswerRow() {
    return this.state.answerBounties.map((bounty, index) => {
      return <DashboardRow
        key={index}
        answer={this.state.userAnswers[index]}
        bounty={bounty}
        userAccount={this.state.userAccount}
      />;
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
            <Header
              content={`You have posted ${this.state.userBountyCount} bounties and awarded ${this.state.userAwardedTotal} ETH.`}
              as="h4"
            />
            <Table>
              <Header>
                <Row>
                  <HeaderCell>SE ID</HeaderCell>
                  <HeaderCell>Question Title and Link</HeaderCell>
                  <HeaderCell>Owner Address / ENS Name</HeaderCell>
                  <HeaderCell>Bounty Value</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </Row>
              </Header>
              <Body>
                {this.renderBountyRow()}
              </Body>
            </Table>
          </Dimmer.Dimmable>

          Found {this.state.bountyCount} bounties.
          <Divider />
          <Dimmer.Dimmable active>
            <Dimmer active={this.state.isLoading} inverted>
              <Loader inverted></Loader>
            </Dimmer>
            <Header
              content={`You have won ${this.state.userWonTotal} ETH from a total of ${this.state.userAnswerCount} answers. (${this.state.userAcceptedCount} accepted.)`}
              as="h4"
            />
            <Table>
              <Header>
                <Row>
                  <HeaderCell>Answer ID</HeaderCell>
                  <HeaderCell>Question Title and Link</HeaderCell>
                  <HeaderCell>Actions</HeaderCell>
                </Row>
              </Header>
              <Body>
                {this.renderAanswerRow()}
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
