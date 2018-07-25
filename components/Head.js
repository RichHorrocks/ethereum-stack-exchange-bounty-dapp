import React, { Component } from 'react';
import { Button, Header, Label, Divider, Icon } from 'semantic-ui-react';
import { Link } from '../routes';
import Status from './Status';

class Head extends Component {
  render() {
    return (
      <div>
        <Header
          content={this.props.title}
          as="h1"
          style={{ fontSize: '2.5em' }}
          size='huge'
        />
        {this.props.type !== 'new' ? (
          <Link route={`/bounties/new`}>
            <a>
              <Button
                content="Post a Bounty"
                color="green"
              />
            </a>
          </Link>
        ) : null }
        {this.props.type !== 'explore' ? (
          <Link route={`/bounties/explore`}>
            <a>
              <Button
                content="Explore Bounties"
                color="teal"
              />
            </a>
          </Link>
        ) : null }
        {this.props.type !== 'dashboard' ? (
          <Link route={`/dashboard/${this.props.userAccount}`}>
            <a>
              <Button
                content="My Dashboard"
                color="violet"
              />
            </a>
          </Link>
        ) : null }
        <Label>
          <Icon name='mail' /> {this.props.userAccount}
        </Label>
        <Header floated='right'>
          <Status
            userAccount={this.props.userAccount}
            networkId={this.props.networkId}
          />
        </Header>
        <Divider />
      </div>
    );
  }
}

export default Head;
