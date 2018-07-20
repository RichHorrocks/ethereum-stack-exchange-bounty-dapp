pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

contract SEBounty is Destructible {
    using SafeMath for uint256;

    event BountyOpened(uint bountyIndex, address bountyOwner, uint questionId);
    event BountyAwarded(uint bountyIndex);
    event BountyClaimed(uint bountyIndex, address answerOwner);
    event BountyCancelled(uint bountyIndex, address bountyOwner);
    event BountyWithdrawn(uint bountyIndex, address bountyOwner);
    event AnswerPosted(uint bountyIndex, address answerOwner, uint answerId);

    enum Stages {
        Opened,
        Awarded,
        Claimed,
        Cancelled,
        Withdrawn
    }

    struct Bounty {
        string description;
        uint questionId;
        uint bountyValue;
        address bountyOwner;
        Stages stage;
        uint[] answers;
        address[] answerOwners;
        uint acceptedAnswer;
    }

    Bounty[] public bounties;

    modifier isBountyOwner(uint _bountyIndex) {
        require(
            bounties[_bountyIndex].bountyOwner == msg.sender,
            "You don't own this bounty!"
        );
        _;
    }

    modifier isAnswerOwner(uint _bountyIndex, uint _answerIndex) {
        require(
            bounties[_bountyIndex].answerOwners[_answerIndex] == msg.sender,
            "You don't own this answer!"
        );
        _;
    }

    modifier isAcceptedAnswerOwner(uint _bountyIndex) {
        Bounty storage bountyRef = bounties[_bountyIndex];
        require(
            bountyRef.answerOwners[bountyRef.acceptedAnswer] == msg.sender,
            "You didn't win the bounty!"
        );
        _;
    }

    modifier atStage(uint _bountyIndex, Stages _stage) {
        require(
            bounties[_bountyIndex].stage == _stage,
            "Function cannot be called at this time."
        );
        _;
    }

    constructor() public {
        owner = msg.sender;
    }

    // Bounty functions.
    function createBounty(
        string _description,
        uint _questionId)
        public
        payable
    {
        // They must send the amount of ETH with their creation request.
        // This must be greater than nothing...
        require(msg.value > 0);

        // Create the bounty and add it to the public array of bounties.
        bounties.push(Bounty({
            description: _description,
            questionId: _questionId,
            bountyValue: msg.value,
            bountyOwner: msg.sender,
            stage: Stages.Opened,
            answers: new uint[](0),
            answerOwners: new address[](0),
            acceptedAnswer: 0
        }));

        emit BountyOpened(bounties.length - 1, msg.sender, _questionId);
    }

    function editBounty(
        uint _bountyIndex,
        string _description)
        public
        payable
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
    {
        if (msg.value != 0) {
            bounties[_bountyIndex].bountyValue = msg.value;
        }

        bounties[_bountyIndex].description = _description;
    }


    function awardBounty(uint _bountyIndex, uint _answerIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
    {
        bounties[_bountyIndex].stage = Stages.Awarded;
        bounties[_bountyIndex].acceptedAnswer = _answerIndex;

        emit BountyAwarded(_bountyIndex);
    }


    function claimBounty(uint _bountyIndex)
        public
        isAcceptedAnswerOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Awarded)
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Claimed;
        uint bounty = bounties[_bountyIndex].bountyValue;
        bounties[_bountyIndex].bountyValue = 0;
        msg.sender.transfer(bounty);

        emit BountyClaimed(_bountyIndex, msg.sender);
    }


    function cancelBounty(uint _bountyIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
    {
        bounties[_bountyIndex].stage = Stages.Cancelled;

        emit BountyCancelled(_bountyIndex, msg.sender);
    }


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

    function getBountyCount()
        public
        view
        returns (uint)
    {
        return bounties.length;
    }


    // Answer functions.
    function postAnswer(uint _bountyIndex, uint _answerId)
        public
        atStage(_bountyIndex, Stages.Opened)
    {
        bounties[_bountyIndex].answers.push(_answerId);
        bounties[_bountyIndex].answerOwners.push(msg.sender);

        emit AnswerPosted(_bountyIndex, msg.sender, _answerId);
    }

    function cancelAnswer(uint _bountyIndex, uint _answerIndex)
        public
        isAnswerOwner(_bountyIndex, _answerIndex)
        atStage(_bountyIndex, Stages.Opened)
    {
        uint len = bounties[_bountyIndex].answers.length;

        if (len > 1) {
            bounties[_bountyIndex].answers[_answerIndex] =
                bounties[_bountyIndex].answers[len - 1];
            bounties[_bountyIndex].answerOwners[_answerIndex] =
                bounties[_bountyIndex].answerOwners[len - 1];
        }
        bounties[_bountyIndex].answers.length--;
        bounties[_bountyIndex].answerOwners.length--;
    }

    function getAnswers(uint _bountyIndex)
        public
        view
        returns (uint [])
    {
        return bounties[_bountyIndex].answers;
    }

    function getAnswerCount(uint _bountyIndex)
        public
        view
        returns (uint)
    {
        return bounties[_bountyIndex].answers.length;
    }
}
