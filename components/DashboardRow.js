import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';
import bounty from '../contractInstance';
import he from 'he';

class DashboardRow extends Component {
  state = {
    isLoading: false,
  };

  render() {
    const { Row, Cell } = Table;
    const { answer, bounty, userAccount } = this.props;
    const linkString = he.decode(bounty[8]);
    const renderCancel = (bounty[4] == 0);
    const renderClaim = ((bounty[4] == 1) && (answer == (bounty[6]).toNumber()));

    return (
      <Row>
        <Cell>
          <a target="_blank" href={`https://ethereum.stackexchange.com/a/${answer}/52`}>
            {answer}
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
