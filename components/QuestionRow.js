import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';
import { Link } from '../routes';
import bounty from '../contractInstance';
import web3 from '../getWeb3';
import he from 'he';

class QuestionRow extends Component {
  state = {
    isLoading: false,
  };

  onCancel = async () => {
    this.setState({ isLoading: true });
    const accounts = await web3.eth.getAccounts();
    await bounty.cancelBounty(this.props.id, { from: accounts[0] });
    this.setState({ isLoading: false });
  };

  render() {
    const { Row, Cell } = Table;
    const { id, bounty, userAccount } = this.props;

    console.log(bounty);

    const renderCancel = (userAccount.toUpperCase() === bounty[3].toUpperCase());

    const address = bounty[3];
    const linkString = he.decode(bounty[7]);

    return (
      <Row>
        <Cell>{id}</Cell>
        <Cell><a target="_blank" href={bounty[6]}>{linkString}</a></Cell>
        <Cell>{bounty[3].toUpperCase()}</Cell>
        <Cell>{bounty[2]}</Cell>
        <Cell>
          <Link route={`/bounties/${address}/${id}`}>
            <a>
              <Button
                content="Details"
                color="teal"
                basic
              />
            </a>
          </Link>
          {renderCancel ? (
            <Button
              content="Cancel"
              color="red"
              basic
              onClick={this.onCancel}
              loading={this.state.isLoading}
            />
          ) : null }
        </Cell>
      </Row>
    );
  }
}

export default QuestionRow;
