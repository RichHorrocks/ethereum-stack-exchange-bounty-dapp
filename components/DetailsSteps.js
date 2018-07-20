import React from 'react';
import { Step } from 'semantic-ui-react';

export default (props) => {
  return (
    <div>
      <Step.Group size='mini'>
        <Step active={props.stage == 0} >
          <Step.Content>
            <Step.Title>Open</Step.Title>
            <Step.Description>The hunt is on!</Step.Description>
          </Step.Content>
        </Step>
        <Step active={props.stage == 1}>
          <Step.Content>
            <Step.Title>Awarded</Step.Title>
            <Step.Description>The owner has selected a winning  answer</Step.Description>
          </Step.Content>
        </Step>
        <Step active={props.stage == 2}>
          <Step.Content>
            <Step.Title>Claimed</Step.Title>
            <Step.Description>The winner has withdrawn the bounty</Step.Description>
          </Step.Content>
        </Step>
        <Step disabled active={props.stage == 3}>
          <Step.Content>
            <Step.Title>Cancelled</Step.Title>
            <Step.Description>The owner has cancelled the bounty</Step.Description>
          </Step.Content>
        </Step>
      </Step.Group>
    </div>
  );
};
