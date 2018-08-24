import React, { Component } from 'react';
import { Table, Button } from 'semantic-ui-react';
import { Link } from '../routes';
import bounty from '../contractInstance';
import he from 'he';

class DashboardRow extends Component {
  state = {
    isLoading: false,
  };

  render() {
    const { Row, Cell } = Table;
    const { answer, bounty, userAccount } = this.props;
    const linkString = he.decode(bounty[10]);
    const renderCancel = (bounty[4] == 0);
    const renderClaim = ((bounty[4] == 1) && (answer == bounty[7]));
    const renderCheck = ((bounty[4] == 2) && (answer == bounty[7]));
    const id = bounty[8];

    return (
      <Row>
        <Cell>
          <a
            target="_blank"
            href={`https://ethereum.stackexchange.com/a/${answer}/52`}>
            {answer}
          </a>
        </Cell>
        <Cell>
          <a target="_blank" href={bounty[9]}>
            {linkString}
          </a>
        </Cell>
        <Cell>
          <Link route={`/bounties/${userAccount}/${id}`}>
            <a>
              {renderClaim ? (
                <Button
                  content="Claim"
                  color="purple"
                  basic
                />
              ) : null }
            </a>
          </Link>
          <Link route={`/bounties/${userAccount}/${id}`}>
            <a>
              {renderCancel ? (
                <Button
                  content="Cancel"
                  color="red"
                  onClick={this.onClick}
                  basic
                />
              ) : null }
            </a>
          </Link>
        </Cell>
      </Row>
    );
  }
}

export default DashboardRow;
