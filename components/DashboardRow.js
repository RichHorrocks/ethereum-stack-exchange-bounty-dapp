import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';
import { Link } from '../routes';
import bounty from '../contractInstance';
import web3 from '../getWeb3';
import he from 'he';

class DashboardRow extends Component {
  state = {
    isLoading: false,
  };

  render() {
    const { Row, Cell } = Table;
    const { answer, bounty, userAccount } = this.props;

console.log(bounty);
    const displayId = answer.toNumber();
    const linkString = he.decode(bounty[8]);

    const renderCancel = (bounty[4] == 0);
    const renderClaim = ((bounty[4] == 1) && (answer.toNumber() == (bounty[6]).toNumber()));

    return (
      <Row>
        <Cell>
          <a target="_blank" href={`https://ethereum.stackexchange.com/a/${displayId}/52`}>
            {displayId}
          </a>
        </Cell>
        <Cell>
          <a target="_blank" href={bounty[7]}>
            {linkString}
          </a>
        </Cell>
        <Cell>
          {renderClaim ? (
            <Button
              content="Claim"
              color="purple"
              basic
            />
          ) : null }
          {renderCancel ? (
            <Button
              content="Cancel"
              color="red"
              basic
            />
          ) : null }
        </Cell>
      </Row>
    );
  }
}

export default DashboardRow;
