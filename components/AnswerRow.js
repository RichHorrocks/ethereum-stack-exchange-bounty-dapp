import React, { Component } from 'react';
import { Table, Button, Icon } from 'semantic-ui-react';
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

  onAward = async () => {
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
      this.props.bountyId,
      { from: this.props.userAccount });
    this.setState({ isLoading: false });
  };

  render() {
    const { Row, Cell } = Table;
    const {
      userAccount,
      answerId,
      acceptedId,
      answerName,
      answerOwner,
      bountyStage,
      bountyOwner,
    } = this.props;
    const displayId = answerId.toNumber();

    const renderCheck = (bountyStage == 1) && (answerId.toNumber() == acceptedId.toNumber());
    const renderAccept =
      (bountyStage == 0) && (bountyOwner.toUpperCase() == userAccount.toUpperCase());
    const renderCancel = (bountyStage == 0) && (userAccount.toUpperCase() === answerOwner.toUpperCase());
    const renderClaim = renderCheck && (userAccount.toUpperCase() === answerOwner.toUpperCase());
    const disableRow = (bountyStage == 1) && !renderCheck;

    return (
      <Row
        positive
        disabled={disableRow}>
        <Cell>
          <a target="_blank" href={`https://ethereum.stackexchange.com/a/${displayId}/52`}>
            {displayId}
          </a>
        </Cell>
        <Cell>{answerName}</Cell>
        <Cell>
          {renderAccept ? (
            <Button
              content="Award"
              color="green"
              basic
              onClick={this.onAward}
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
