## Design Patterns

#### Factory Pattern (Not implemented)

This was one of the most important design decisions for this particular dapp: Should I deploy a factory contract which would itself deploy child bounty contracts as new bounties were created?

An example of such a contract is below.
```
contract StackBountyFactory {
    address[] public allDeployedBounties;
    mapping (address => address[]) userDeployedBounties;

    function createBounty(uint _questionId,string _description) public {
        address newBounty = new StackBounty(_questionId,
                                            _description,
                                            msg.sender);
        allDeployedBounties.push(newBounty);
        userDeployedBounties[msg.sender].push(newBounty);
    }

    function getUserDeployedBounties() public view returns (address[]) {
        return userDeployedBounties[msg.sender];
    }

    function deployedBounties() public view returns (address[]) {
        return allDeployedBounties;
    }
}
```
I tested this idea, but decided that the gas costs involved with deploying a new contract for each bounty would make this pattern economically unattractive, at least at current gas prices.

#### State Machine (Implemented)

The main contract uses a state machine to record the stage each bounty is currently in. Together with the `atStage()` modifier, this allows only certain functions to be called depending on which stage in its lifecycle a bounty is currently in.
```
    function withdrawBounty(uint _bountyIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Cancelled)
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Withdrawn;
        uint bounty = bounties[_bountyIndex].bountyValue;

        // Don't explicitly delete. Let the compiler clean things up.
        if (bounties.length > 1) {
            bounties[_bountyIndex] = bounties[bounties.length - 1];
        }
        bounties.length--;

        msg.sender.transfer(bounty);

        emit BountyWithdrawn(_bountyIndex, msg.sender);
    }
```
This helps to prevent re-entrancy attacks: the first action inside the function is to update the state to `Withdrawn`, and the `atStage()` modifier prevents re-entering the function once in this state.

#### Checks-Effects-Interactions Pattern (Implemented)

As shown in the `claimBounty()` function, which uses the Withdraw Pattern.
```
    function claimBounty(uint _bountyIndex)
        public
        isAcceptedAnswerOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Awarded)
    {
        bounties[_bountyIndex].stage = Stages.Claimed;
        uint bounty = bounties[_bountyIndex].bountyValue;
        bounties[_bountyIndex].bountyValue = 0;

        msg.sender.transfer(bounty);

        emit BountyClaimed(_bountyIndex, msg.sender);
    }
```
**Checks:**
 - Is this the person who answered the question?
 - Are we in the correct stage to allow this interaction to happen?

**Effects:**
 - Use a convenience variable to hold the value of the bounty.
 - Zero out the value in the state data.

**Interaction:**
 - Call `transfer()` to send the value.
