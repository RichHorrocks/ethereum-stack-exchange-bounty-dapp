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
    await bounty.cancelBounty(
      this.props.id,
      {
        from: accounts[0],
        gas: 200000,
      });
    this.setState({ isLoading: false });
  };

  render() {
    const { Row, Cell } = Table;
    const { id, bounty, userAccount } = this.props;
    const address = bounty[3];
    const linkString = he.decode(bounty[8]);
    const disableRow = (bounty[4] == 2);
    const renderCancel = !disableRow && (bounty[4] == 0) &&
      (userAccount.toUpperCase() === bounty[3].toUpperCase());

    return (
      <Row
        disabled={disableRow}>
        <Cell>{bounty[1]}</Cell>
        <Cell><a target="_blank" href={bounty[7]}>{linkString}</a></Cell>
        <Cell>{address.toUpperCase()}</Cell>
        <Cell>{web3.utils.fromWei(bounty[2], 'ether')}</Cell>
        <Cell>
            <Link route={`/bounties/${address}/${id}`}>
              <a>
                {disableRow ? null :
                  <Button
                    content="Details"
                    color="teal"
                    basic
                  />
                }
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
