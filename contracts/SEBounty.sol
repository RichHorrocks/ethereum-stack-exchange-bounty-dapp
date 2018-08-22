pragma solidity ^0.4.20;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';
import './oraclizeAPI_0.5.sol';

/**
 * @title  SEBounty
 * @author Richard Horrocks
 * @notice Contract to allow ETH bounties to be placed on existing questions
 *         from the Ethereum Stack Exchange site, and answers submitted.
 * @dev    See https://github.com/RichHorrocks/consensys-academy-project.git
 *         Uses Destructible.sol for lifecycle functionality.
 *         Uses Pausable.sol for circuit-breaker functionality.
 *         Uses usingOraclize for Oraclize functionality.
 *         Uses SafeMath.sol for overflow protection.
 */
contract SEBounty is Destructible, Pausable, usingOraclize {
    /**
     * SafeMath is used for integer operations to prevent overflow.
     */
    using SafeMath for uint256;

    /**
     * Stages
     *
     * An enum defining the different stages of a bounty's lifecycle. This
     * acts as a state machine to allow flow control: transitions can only occur
     * from one stage to the immediate next.
     */
    enum Stages {
        Opened,
        Awarded,
        Claimed,
        Cancelled
    }

    /**
     * Bounty
     *
     * This is the main bounty structure definition.
     *
     *  description    - Instructions imposed by the poster of the bounty.
     *  questionID     - The Stack Exchange question ID of the bounty.
     *  bountyValue    - The value of the bounty, in wei.
     *  bountyOwner    - The address of the bounty owner.
     *  stage          - The current stage of the bounty.
     *  answers        - An array of IDs of answers that have been posted.
     *  answerOwners   - A corresponding array of addresses of answer owners.
     *  acceptedAnswer - The index of the accepted answer.
     *  timePosted     - The timestamp of when the bounty was posted.
     *  hasAnswered    - A mapping showing which addresses have already
     *                   answered.
     */
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

    /**
     * bounties
     *
     * An array containing the currently open bounties.
     */
    Bounty[] public bounties;

    /**
     * bountyCount
     *
     * A mapping to store the number of bounties open for a given address.
     */
    mapping (address => uint256) public bountyCount;

    /**
     * awardedTotal
     *
     * A mapping to store the total amount, in wei, awarded _by_ a given
     * address.
     */
    mapping (address => uint256) public awardedTotal;

    /**
     * answerCount
     *
     * A mapping to store the number of answers posted _by_ a given address.
     */
    mapping (address => uint256) public answerCount;

    /**
     * acceptedCount
     *
     * A mapping to store the number of bounties won _by_ a given address.
     */
    mapping (address => uint256) public acceptedCount;

    /**
     * wonTotal
     *
     * A mapping to store the total amount, in wei, won _by_ a given address.
     */
    mapping (address => uint256) public wonTotal;

    /**
     * Events
     */

     /**
      * BountyAwarded       - Event emitted when bounty is awarded.
      * BountyClaimed       - Event emitted when bounty is claimed.
      * BountyCancelled     - Event emitted when bounty is cancelled.
      * AnswerPosted        - Event emitted when answer is posted.
      * EmergencyWithdrawal - Event emitted when the contract is paused and all
      *                       funds are withdrawn.
      */
    event BountyAwarded(uint bountyIndex);
    event BountyClaimed(uint bountyIndex, address answerOwner);
    event BountyCancelled(uint bountyIndex, address bountyOwner);
    event AnswerPosted(uint bountyIndex, address answerOwner, uint answerId);
    event EmergencyWithdrawal(address withdrawalAddress, uint balance);

    /**
     * Oraclize-related code
     */

    /**
     * OracleCallbackDetails
     *
     * This is a structure containing details of a new bounty, created in
     * postBounty, stored as a state variable, and then used in the Oraclize
     * callback. This, when stored in a mapping, allows the two transactions
     * associated with posting a bounty to be linked together.
     *
     *  desc        - Instructions imposed by the poster of the bounty.
     *  questionID  - The Stack Exchange question ID of the bounty.
     *  bountyValue - The value of the bounty, in wei.
     *  bountyOwner - The address of the bounty owner.
     */
    struct OracleCallbackDetails {
        string desc;
        uint questionId;
        uint bountyValue;
        address bountyOwner;
    }

    /**
     * oracleDetails
     *
     * A mapping which maps an ID returned by oraclize_query to a struct
     * containing details of a posted bounty. This allows details of a bounty
     * to persist while waiting for the Oraclize callback to be called.
     */
    mapping(bytes32 => OracleCallbackDetails) oracleDetails;

    /**
     * newOraclizeQuery
     *
     * Event to emit when a new Oraclize query is sent.
     */
    event newOraclizeQuery(string description, bytes32 id, address caller);

    /**
     * OraclizeQueryFail
     *
     * Event to emit if there's a failure during the Oraclize callback. For
     * example, if no data is returned from the query, or if the query was
     * invalid.
     */
    event OraclizeQueryFail(address caller);

    /**
     * OraclizeQuerySuccess
     *
     * Event to emit on callback success. This allows a front end to confirm
     * that the callback was called successfully, and therefore the overall
     * posting of a bounty was a success.
     */
    event OraclizeQuerySuccess(address caller, uint questionId);

    /**
     * oraclizeFee
     *
     * The current fee to use the Oraclize service, on Rinkeby.
     */
    uint256 oraclizeFee = 0.0100355 ether;


    /**
     * Modifiers
     */

    /**
     * isBountyOwner
     *
     * Modifies a function so that it can only be called by the owner of the
     * contract.
     */
    modifier isBountyOwner(uint _bountyIndex) {
        require(bounties[_bountyIndex].bountyOwner == msg.sender);
        _;
    }

    /**
     * isAnswerOwner
     *
     * Modifies a function so that it can only be called by the owner of the
     * answer associated with the _answerIndex parameter.
     */
    modifier isAnswerOwner(uint _bountyIndex, uint _answerIndex) {
        require(
            bounties[_bountyIndex].answerOwners[_answerIndex] == msg.sender
        );
        _;
    }

    /**
     * isAcceptedAnswerOwner
     *
     * Modifies a function so that it can only be called by the owner of the
     * answer which has been accepted for the given bounty.
     */
    modifier isAcceptedAnswerOwner(uint _bountyIndex) {
        Bounty storage bountyRef = bounties[_bountyIndex];
        require(
            bountyRef.answerOwners[bountyRef.acceptedAnswer] == msg.sender
        );
        _;
    }

    /**
     * atStage
     *
     * Modifies a function so that it can only be called when the given bounty
     * is at a given stage. This enforces a state machine, whereby the stages of
     * bounty follow a logical ordering.
     */
    modifier atStage(uint _bountyIndex, Stages _stage) {
        require(
            bounties[_bountyIndex].stage == _stage
        );
        _;
    }

    /**
     * @notice  Contract constructor function.
     * @dev     Note that using Oraclize has imposed the use of an earlier
     *          compiler version, which doesn't support the "constructor"
     *          keyword. We resort to defining the constructor as a function.
     */
    function SEBounty()
        public
    {
        owner = msg.sender;
    }

    /**
     * Bounty functions.
     */

    /**
     * @notice  Oraclize callback function.
     * @dev     This is called by Oraclize, so the msg.sender value will be
     *          different to the one that called postBounty.
     * @param   _myId - The Oraclize query ID associated with this callback
     *           call.
     * @param   _result - The result of the Oraclize query.
     */
    function __callback(bytes32 _myId, string _result)
        public
        whenNotPaused()
    {
        // This transaction can only be initiated by Oraclize.
        require(msg.sender == oraclize_cbAddress());

        // Get the details we stored in postBounty().
        OracleCallbackDetails storage details = oracleDetails[_myId];

        // Check the query result is valid.
        if (bytes(_result).length == 0 ||
            parseInt(_result) != details.questionId) {
            OraclizeQueryFail(details.bountyOwner);
            delete oracleDetails[_myId];
            revert();
        }

        // Actually create the bounty and push to state.
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

        OraclizeQuerySuccess(details.bountyOwner, details.questionId);
        delete oracleDetails[_myId];
    }

    /**
     * @notice  Post a bounty on a Stack Exchange question.
     * @dev     This function creates an Oraclize query to check whether the
     *          passed in question ID is a valid Stack Exchange question.
     * @param   _description - A set of instructions written by the bounty
                poster explaining what an ideal answer should contain.
     * @param   _questionId - The Stack Exchange question ID.
     */
    function postBounty(string _description, uint _questionId)
        public
        payable
        whenNotPaused()
    {
        // Check the msg.value is enough to pay for Oraclize.
        require(msg.value > oraclizeFee);

        // Create the Oraclize query string.
        string memory queryString = strConcat(
            "json(https://api.stackexchange.com/2.2/questions/",
            uIntToStr(_questionId),
            "?site=ethereum&key=fMcgqnTvxidY8Sk8n1BcbQ(().items[0].question_id");

        // Query Oraclize.
        bytes32 oracleId = oraclize_query("URL", queryString, 500000);

        // Save the details for use in the Oraclize callback.
        oracleDetails[oracleId] = OracleCallbackDetails(
            _description,
            _questionId,
            msg.value - oraclizeFee,
            msg.sender);

        newOraclizeQuery("Oraclize query sent", oracleId, msg.sender);
    }

    /**
     * @notice  Award a bounty to a particular answer.
     * @dev     This must only be called by the owner of the open bounty. Again,
     *          knowing the index of each answer is made easier by using an
     *          appropriate front-end site.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @param   _answerIndex - The index into the array of answers associated
     *          with this bounty.
     */
    function awardBounty(uint _bountyIndex, uint _answerIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        // Use the state machine to protect against reentrancy.
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

    /**
     * @notice  Claim a bounty that has been awarded.
     * @dev     This must only be called by the owner of the winning answer.
     *          This function uses the Checks-Effects-Interactions pattern.
     * @param   _bountyIndex - The index into the array of open bounties.
     */
    function claimBounty(uint _bountyIndex)
        public
        isAcceptedAnswerOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Awarded)
        whenNotPaused()
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Claimed;

        // Use the Checks-Effects-Interactions pattern for safety.
        uint bounty = bounties[_bountyIndex].bountyValue;
        bounties[_bountyIndex].bountyValue = 0;
        msg.sender.transfer(bounty);

        BountyClaimed(_bountyIndex, msg.sender);
    }

    /**
     * @notice  Cancel an open bounty.
     * @dev     This must only be called by the owner of the open bounty.
     * @param   _bountyIndex - The index into the array of open bounties.
     */
    function cancelBounty(uint _bountyIndex)
        public
        isBountyOwner(_bountyIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        // Use the state machine to protect against reentrancy.
        bounties[_bountyIndex].stage = Stages.Cancelled;
        uint bounty = bounties[_bountyIndex].bountyValue;

        /*
         * To delete the entry from the array, copy the last entry in the array
         * over the entry to delete, then reduce the size of the array by one.
         * It's not important to maintain order. The compiler will
         * automatically reduce the size of the array, meaning we don't need to
         * call delete(). This saves gas costs.
         */
        if (bounties.length > 1) {
            bounties[_bountyIndex] = bounties[bounties.length - 1];
        }
        bounties.length--;
        bountyCount[msg.sender]--;

        msg.sender.transfer(bounty);

        BountyCancelled(_bountyIndex, msg.sender);
    }

    /**
     * Answer functions.
     */

    /**
     * @notice  Post an answer on an existing bounty.
     * @dev     Calling this function requires the user to know the index of the
     *          bounty they're answering. This is made much easier by using an
     *          appropriate front-end site.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @param   _answerId - The ID of the answer in Stack Exchange.
     */
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

    /**
     * @notice  Cancel an answer previously posted on an open bounty.
     * @dev     This must only be called by the owner of the answer. Again,
     *          knowing the index of each answer is made easier by using an
     *          appropriate front-end site.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @param   _answerIndex - The index into the array of answers associated
     *          with this bounty.
     */
    function cancelAnswer(uint _bountyIndex, uint _answerIndex)
        public
        isAnswerOwner(_bountyIndex, _answerIndex)
        atStage(_bountyIndex, Stages.Opened)
        whenNotPaused()
    {
        Bounty storage bountyRef = bounties[_bountyIndex];
        uint len = bountyRef.answers.length;

        /*
         * To delete the entry from the array, copy the last entry in the array
         * over the entry to delete, then reduce the size of the array by one.
         * It's not important to maintain order. The compiler will
         * automatically reduce the size of the array, meaning we don't need to
         * call delete(). This saves gas costs.
         */
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

    /**
     * Getter functions. (Those not automatically generated by the compiler.)
     */

    /**
     * @notice  Get the total number of open bounties.
     * @dev     The same could be achieved by having a state variable.
     * @return  The number of open bounties.
     */
    function getBountyCount()
        public
        view
        returns (uint)
    {
        return bounties.length;
    }

    /**
     * @notice  Get the answers sumitted for a bounty.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @return  An array of answer IDs.
     */
    function getAnswers(uint _bountyIndex)
        public
        view
        returns (uint [])
    {
        return bounties[_bountyIndex].answers;
    }

    /**
     * @notice  Get the owner addresses of answers sumitted for a bounty.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @return  An array of addresses equating to the answer owners.
     */
    function getAnswerOwners(uint _bountyIndex)
        public
        view
        returns (address [])
    {
        return bounties[_bountyIndex].answerOwners;
    }

    /**
     * @notice  Get the number of answers sumitted for a bounty.
     * @param   _bountyIndex - The index into the array of open bounties.
     * @return  The number of answers for this bounty.
     */
    function getAnswerCount(uint _bountyIndex)
        public
        view
        returns (uint)
    {
        return bounties[_bountyIndex].answers.length;
    }

    /**
     * Ether functions.
     */

    /**
     * @notice  Get the total bounty balance held by the contract.
     * @dev     This must only be callable by the contract owner.
     * @return  The contract balance, in wei.
     */
    function getBalance()
        public
        onlyOwner
        view
        returns (uint)
    {
        return this.balance;
    }

    /**
     * @notice  Withdraw the contract's balance in an emergency.
     * @dev     This can only be called if the contract has been paused, answer
     *          only by the contract owner. (onlyOwner is inherited from the
     *          Pausable contract, so not explicitly set here.)
     */
    function withdrawInEmergency()
        public
        whenPaused()
    {
        uint balance = address(this).balance;
        msg.sender.transfer(balance);

        EmergencyWithdrawal(msg.sender, balance);
    }

    /**
     * @notice  Fallback function to accept ether sent directly to the contract.
     */
    function ()
        public
        payable
    { }

    /**
     * Internal helper functions.
     */

     /**
      * @notice  Create a string representation of a number.
      * @param   i - The integer to convert.
      * @return  The string representation.
      */
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
}
