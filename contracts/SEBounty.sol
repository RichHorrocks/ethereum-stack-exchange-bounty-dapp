pragma solidity ^0.4.20;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './oraclizeAPI_0.5.sol';

contract SEBounty is Destructible, Pausable, usingOraclize {
    using SafeMath for uint256;

    event BountyOpened(uint bountyIndex, address bountyOwner, uint questionId);
    event BountyAwarded(uint bountyIndex);
    event BountyClaimed(uint bountyIndex, address answerOwner);
    event BountyCancelled(uint bountyIndex, address bountyOwner);
    event AnswerPosted(uint bountyIndex, address answerOwner, uint answerId);
    event EmergencyWithdrawal(address withdrawalAddress, uint balance);

    enum Stages {
        Opened,
        Awarded,
        Claimed,
        Cancelled
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
        uint timePosted;
        mapping (address => bool) hasAnswered;
    }

    Bounty[] public bounties;
    mapping (address => uint256) public bountyCount;
    mapping (address => uint256) public awardedTotal;
    mapping (address => uint256) public answerCount;
    mapping (address => uint256) public acceptedCount;
    mapping (address => uint256) public wonTotal;

    struct OracleCallbackDetails {
        string desc;
        uint questionId;
        uint bountyValue;
        address bountyOwner;
        uint bountyIndex;
        uint answerId;
    }

    mapping(bytes32 => OracleCallbackDetails) oracleDetails;
    event newOraclizeQuery(string description, bytes32 id, address caller);
    event OraclizeQueryFail(address caller);
    event OraclizeQuerySuccess(address caller);

    modifier isBountyOwner(uint _bountyIndex) {
        require(bounties[_bountyIndex].bountyOwner == msg.sender);
        _;
    }

    modifier isAnswerOwner(uint _bountyIndex, uint _answerIndex) {
        require(
            bounties[_bountyIndex].answerOwners[_answerIndex] == msg.sender
        );
        _;
    }

    modifier isAcceptedAnswerOwner(uint _bountyIndex) {
        Bounty storage bountyRef = bounties[_bountyIndex];
        require(
            bountyRef.answerOwners[bountyRef.acceptedAnswer] == msg.sender
        );
        _;
    }

    modifier atStage(uint _bountyIndex, Stages _stage) {
        require(
            bounties[_bountyIndex].stage == _stage
        );
        _;
    }

    function SEBounty() public {
        owner = msg.sender;
    }

    function __callback(bytes32 myid, string result) public {
        require(msg.sender == oraclize_cbAddress());

        OracleCallbackDetails storage details = oracleDetails[myid];

        if (bytes(result).length == 0 ||
            parseInt(result) != details.questionId) {
            OraclizeQueryFail(details.bountyOwner);
            delete oracleDetails[myid];
            revert();
        }

        Bounty memory newBounty = Bounty({
            description: details.desc,
            questionId: details.questionId,
            bountyValue: details.bountyValue,
            bountyOwner: details.bountyOwner,
            stage: Stages.Opened,
            answers: new uint[](0),
            answerOwners: new address[](0),
            acceptedAnswer: 0,
            timePosted: now
        });

        bounties.push(newBounty);
        bountyCount[details.bountyOwner]++;

        OraclizeQuerySuccess(details.bountyOwner);
        delete oracleDetails[myid];
    }

    function postBounty(string _description, uint _questionId)
        public
        payable
    {
        // They must send the amount of ETH with their creation request.
        // This must be greater than nothing...
        require(msg.value > 0);

        string memory queryString = strConcat(
            "json(https://api.stackexchange.com/2.2/questions/",
            uIntToStr(_questionId),
            "?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ(().items[0].question_id");

        bytes32 oracleId = oraclize_query("URL", queryString, 500000);

        oracleDetails[oracleId] = OracleCallbackDetails(
            _description,
            _questionId,
            msg.value,
            msg.sender,
            0,
            0);

        newOraclizeQuery("Oraclize query sent", oracleId, msg.sender);
    }

    function postAnswer(uint _bountyIndex, uint _answerId)
        public
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        Bounty storage bountyRef = bounties[_bountyIndex];
        require(!bountyRef.hasAnswered[msg.sender]);

        bountyRef.answers.push(_answerId);
        bountyRef.answerOwners.push(msg.sender);
        bountyRef.hasAnswered[msg.sender] = true;
        answerCount[msg.sender]++;

        AnswerPosted(_bountyIndex, msg.sender, _answerId);
    }

    function awardBounty(uint _bountyIndex, uint _answerIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        bounties[_bountyIndex].stage = Stages.Awarded;
        bounties[_bountyIndex].acceptedAnswer = _answerIndex;

        awardedTotal[msg.sender] =
            awardedTotal[msg.sender].add(bounties[_bountyIndex].bountyValue);
        address winner = bounties[_bountyIndex].answerOwners[_answerIndex];
        wonTotal[winner] =
            wonTotal[winner].add(bounties[_bountyIndex].bountyValue);
        acceptedCount[winner]++;

        BountyAwarded(_bountyIndex);
    }


    function claimBounty(uint _bountyIndex)
        public
        isAcceptedAnswerOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Awarded)
        whenNotPaused()
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Claimed;
        uint bounty = bounties[_bountyIndex].bountyValue;
        bounties[_bountyIndex].bountyValue = 0;
        msg.sender.transfer(bounty);

        BountyClaimed(_bountyIndex, msg.sender);
    }


    function cancelBounty(uint _bountyIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Cancelled;
        uint bounty = bounties[_bountyIndex].bountyValue;

        // Don't explicitly delete. Let the compiler clean things up.
        if (bounties.length > 1) {
            bounties[_bountyIndex] = bounties[bounties.length - 1];
        }
        bounties.length--;
        bountyCount[msg.sender]--;

        msg.sender.transfer(bounty);

        BountyCancelled(_bountyIndex, msg.sender);
    }

    // Answer functions.
    function cancelAnswer(uint _bountyIndex, uint _answerIndex)
        public
        isAnswerOwner(_bountyIndex, _answerIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        Bounty storage bountyRef = bounties[_bountyIndex];
        uint len = bountyRef.answers.length;

        if (len > 1) {
            bountyRef.answers[_answerIndex] = bountyRef.answers[len - 1];
            bountyRef.answerOwners[_answerIndex] =
                bountyRef.answerOwners[len - 1];
        }
        bountyRef.answers.length--;
        bountyRef.answerOwners.length--;

        answerCount[msg.sender]--;
        bountyRef.hasAnswered[msg.sender] = false;
    }

    function getBountyCount()
        public
        view
        returns (uint)
    {
        return bounties.length;
    }

    function getAnswers(uint _bountyIndex)
        public
        view
        returns (uint [])
    {
        return bounties[_bountyIndex].answers;
    }

    function getAnswerOwners(uint _bountyIndex)
        public
        view
        returns (address [])
    {
        return bounties[_bountyIndex].answerOwners;
    }

    function getAnswerCount(uint _bountyIndex)
        public
        view
        returns (uint)
    {
        return bounties[_bountyIndex].answers.length;
    }

    function getBalance()
        public
        view
        returns (uint)
    {
        return this.balance;
    }

    function withdrawInEmergency()
        public
        whenPaused()
    {
        uint balance = address(this).balance;
        msg.sender.transfer(balance);

        EmergencyWithdrawal(msg.sender, balance);
    }

    function uIntToStr(uint i)
        internal
        pure
        returns (string)
    {
        if (i == 0) return "0";
        uint j = i;
        uint len;
        while (j != 0){
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (i != 0){
            bstr[k--] = byte(48 + i % 10);
            i /= 10;
        }
        return string(bstr);
    }

    function ()
        public
        payable
    { }
}
