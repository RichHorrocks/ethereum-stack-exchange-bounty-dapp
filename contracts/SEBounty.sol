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

    // Tightly pack by putting ints together?
    //
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

    // Oracle code.
    enum OracleQuery {
        Question,
        Answer
    }

    struct OracleCallbackDetails {
        string desc;
        uint questionId;
        uint bountyValue;
        address bountyOwner;
        uint bountyIndex;
        uint answerId;
        OracleQuery queryType;
    }

    mapping(bytes32 => OracleCallbackDetails) oracleDetails;
    event newOraclizeQuery(string description);

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
            // Event to show error.
            OraclizeQueryFail(details.bountyOwner);

            delete oracleDetails[myid];
            revert();
        }

        if (details.queryType == OracleQuery.Question) {
            // Parse the result as an integer, and check it matches our question
            // ID.
            Bounty memory newBounty = Bounty({
                description: '',
                questionId: details.questionId,
                bountyValue: details.bountyValue,
                bountyOwner: details.bountyOwner,
                stage: Stages.Opened,
                answers: new uint[](0),
                answerOwners: new address[](0),
                acceptedAnswer: 0,
                timePosted: now
            });

            // Create the bounty and add it to the public array of bounties.
            bounties.push(newBounty);
            bountyCount[details.bountyOwner]++;

        } else if (oracleDetails[myid].queryType == OracleQuery.Answer) {
            uint index = details.bountyIndex;
            address sender = details.bountyOwner;

            bounties[index].answers.push(details.answerId);
            bounties[index].answerOwners.push(sender);
            bounties[index].hasAnswered[sender] = true;
            answerCount[sender]++;
        }

        // Event to show success.
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

        // Use an oracle to check that this question exists, and is not closed.
        // Revert otherwise.


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
            0,
            OracleQuery.Question);

        newOraclizeQuery("Oraclize BOUNTY query was sent.");
    }

    function postAnswer(uint _bountyIndex, uint _answerId)
        public
    {
        require(!bounties[_bountyIndex].hasAnswered[msg.sender]);

        // Use oracle to check if the posted question is valid for the given
        // question.
        // Use an oracle to check that this question exists, and is not closed.
        // Revert otherwise.


        string memory queryString = strConcat(
            "json(https://api.stackexchange.com/2.2/answers/",
            uIntToStr(_answerId),
            "?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ(().items[0].question_id");

        bytes32 oracleId = oraclize_query("URL", queryString, 500000);

        oracleDetails[oracleId] = OracleCallbackDetails(
            '',
            bounties[_bountyIndex].questionId,
            0,
            msg.sender,
            _bountyIndex,
            _answerId,
            OracleQuery.Answer);

        newOraclizeQuery("Oraclize ANSWER query was sent.");
    }









    function awardBounty(uint _bountyIndex, uint _answerIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        bounties[_bountyIndex].stage = Stages.Awarded;
        bounties[_bountyIndex].acceptedAnswer = _answerIndex;

        // Use Safemath here.
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


    function getBountyCount()
        public
        view
        returns (uint)
    {
        return bounties.length;
    }


    // Answer functions.
    function cancelAnswer(uint _bountyIndex, uint _answerIndex)
        public
        isAnswerOwner(_bountyIndex, _answerIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
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

        answerCount[msg.sender]--;
        bounties[_bountyIndex].hasAnswered[msg.sender] = false;
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

    function () public payable { }

    function getBalance() public view returns (uint) {
        return this.balance;
    }
}
