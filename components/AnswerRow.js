import React, { Component } from 'react';
import { Table, Button, Icon } from 'semantic-ui-react';
import { Link } from '../routes';
import bounty from '../contractInstance';

class AnswerRow extends Component {
  state = {
    isLoading: false,
  };

  onCancel = async () => {
    this.setState({ isLoading: true });
    await bounty.cancelAnswer(0, this.props.id, { from: this.props.userAccount });
    this.setState({ isLoading: false });
  };

  onAccept = async () => {
    this.setState({ isLoading: true });
    await bounty.awardBounty(
      this.props.bountyId,
      this.props.answerIndex,
      { from: this.props.userAccount });
    this.setState({ isLoading: false });
  };

  onClaim = async () => {
    this.setState({ isLoading: true });
    await bounty.claimBounty(
      this.props.key,
      { from: this.props.userAccount });
    this.setState({ isLoading: false });
  };

  render() {
    const { Row, Cell } = Table;
    const { answerId, acceptedId, owner } = this.props;
    const displayId = answerId.toNumber();

console.log(answerId.toNumber());
console.log(acceptedId.toNumber());
    const renderCheck = (answerId.toNumber() == acceptedId.toNumber());
    const renderCancel = !renderCheck || acceptedId.toNumber() == 0;
    const renderAccept = !renderCheck;
    const renderClaim = true;

    return (
      <Row positive>
        <Cell>
          <a target="_blank" href={`https://ethereum.stackexchange.com/a/${displayId}/52`}>
            {displayId}
          </a>
        </Cell>
        <Cell>{owner}</Cell>
        <Cell>

          {renderAccept ? (
            <Button
              content="Award"
              color="green"
              basic
              onClick={this.onAccept}
              loading={this.state.isLoading}
            />
          ) : null }
              {renderCancel ? (
                <Button
                  content="Cancel"
                  color="red"
                  basic
                  onClick={this.onCancel}
                  loading={this.state.isLoading}
                />
              ) : null }
              {renderClaim ? (
                <Button
                  content="Claim"
                  color="purple"
                  basic
                  onClick={this.onClaim}
                  loading={this.state.isLoading}
                />
              ) : null }
              {renderCheck ? (
                <Icon name='checkmark' />
              ) : null }
        </Cell>
      </Row>
    );
  }
}

export default AnswerRow;
