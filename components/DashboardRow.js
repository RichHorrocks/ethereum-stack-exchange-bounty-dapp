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

    const displayId = answer.toNumber();
    const linkString = he.decode(bounty[7]);

    return (
      <Row>
        <Cell>
          <a target="_blank" href={`https://ethereum.stackexchange.com/a/${displayId}/52`}>
            {displayId}
          </a>
        </Cell>
        <Cell>
          <a target="_blank" href={bounty[6]}>
            {linkString}
          </a>
        </Cell>
        <Cell>
          <Button
            content="Claim"
            color="purple"
            basic
          />
          <Button
            content="Cancel"
            color="red"
            basic
          />
        </Cell>
      </Row>
    );
  }
}

export default DashboardRow;
