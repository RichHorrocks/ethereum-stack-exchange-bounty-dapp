# consensys-academy-project

This README covers the following topics:
 * [Dapp Overview](#dapp-overview)
 * [Dapp Instructions](#dapp-instructions)
 * [Design Patterns](#design-patterns)
 * [Security and Common Attack Mitigation](#security-and-common-attack-mitigation)
 * [Final Project Specification - The Rubric](#final-project-specification)
 * [Future Improvements](#future-improvements)

---
## Dapp Overview

This dapp provides a financial overlay to the Stack Exchange question and
answer site. This can be used to compliment Stack Exchange's own bounty mechanism, in this case by paying ETH instead of reputation points.

In short, the dapp allows users to:
 * Post bounties on existing Stack Exchange questions, regardless of who posted
 the question originally.
 * Post answers to open bounties, either by:
   * Creating a new answer on Stack Exchange, and then posting a link to this
   answer in the dapp; or
   * Posting a link to someone else's Stack Exchange answer in the dapp.

Note that _any_ Stack Exchange answer can be posted in response to a bounty,
allowing the answers of unrelated questions to cross-pollinate, something that can't be done on Stack Exchange.

Note also that bounties can be added on Stack Exchange questions that have already been marked as "accepted". This is especially useful for cases where the existing accepted answer is deemed insufficient, but posting the question again would result in it being marked a duplicate.

Though this dapp is currently scoped to the Ethereum site, it could easily be
extended to cover any or all Stack Exchange sites.

---
## Dapp instructions

The dapp has 5 main pages:
 * **The front page splash**

   This is simply a page introducing the site, with a background image served from IPFS.

 * **The Explore Bounties page**

   This page lists all currently open bounties, together with inactive entries for bounties that have already been fulfilled.

 * **The Post a Bounty page**

   From here a user can create a new bounty. The page contains a set of instructions on how to go about this. The dapp uses Oraclize to query Stack Exchange for the validity of any question posted.

 * **The Dashboard page**

   This is a user's dashboard, where a user is identified by their Metamask account address. The page displays their currently open bounties, and any bounties they've posted an answer to.

 * **The Bounty page**

   This page details a particular bounty, including any instructions written by the owner, together with any answers that have been posted in response.

#### Posting a new bounty

The general workflow for posting a new bounty is as follows:

 * Find the question on Stack Exchange they want to post the bounty on;
 * Get the question's ID number from its URL;
 * Navigate to the Post Bounty page;
 * Add the question's ID number;
 * Add the value of the bounty, noting that the units can be changed in the dropdown;
 * Add any instructions, or particular features they want a good answer to contain.

#### Posting a new answer

The general workflow for posting a new answer is as follows:

 * Either find an existing answer on Stack Exchange which fulfills the bounty, or create a new answer;
 * On Stack Exchange, underneath the answer is a "Share" link. Clicking this shows a URL, in which is the answer ID;
 * On the target bounty's details page, enter the answer ID, and the answer will be added to the bounty.

#### Further actions

Once answers have been added to a bounty, the bounty owner awards the bounty to one of the answers.

Once a bounty is awarded, the owner of the winning answer can withdraw the bounty.


---
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

---
## Security and Common Attack Mitigation

Certain of the design features mentioned above aim to mitigate certain attacks.

 * State machine: Helps prevent re-entrancy.
 * Checks-Effects-Interactions: Helps prevent re-entrancy.

In addition to reentrancy, the following are also mitigated against:

 * **Integer overflow**

   SafeMath.sol is used in certain places to prevent overflow, though in reality, more ETH than exists would be required to overflow in these cases.

 * **DoS (causing a revert)**

   When a bounty is awarded in `awardBounty()`, the winner must call a further function, `claimBounty()` to withdraw their prize. We are therefore favouring pull payments over push payments, which ensures the receiving address is able to receive (because they initiated the withdrawal).

---
## Final Project Specification - The Rubric
### User Interface Requirements

* **Run app on a dev server locally for testing/grading**

  First clone the repository:
  ```
  git clone https://github.com/RichHorrocks/consensys-academy-project.git
  ```

  Included in the repository is the ```package.json```, which specificies the main dependencies of the front end. To install the dependencies, from the root of the project, run:
  ```
  npm install
  ```

  With the dependencies installed, a local web server can be run using:
  ```
  node server.js
  ```
---
* **Should be able to visit a URL and interact with the app**

  The local site created in the first step can be accessed at ```localhost:3000```.

  A public version of the site is hosted on Rinkeby at ...

---
* **The application should have the following features:**
   * **Display the current Metamask account**

     On the first splash page, this can be found at the bottom, in the middle of the page. On all other pages, this can be found in the top bar.

     If the user selects a different account in Metamask, the page will automatically re-render.

   * **Sign transactions using Metamask**

     Any interaction with the contract that incurs a fee will present the user with the Metamask confirmation pop-up. Those interactions are posting or cancelling a bounty or an answer.

   * **Reflect updates to the contract state**

     Any creation or cancellation of bounties or answers are automatically reflected in the front end by way of a page re-rendering.

---
### Testing

* **5 tests with explanations for each smart contract written**

  Only 1 contract was written from scratch: ```SEBounty.sol```. Other contracts are imported, and appropriate tests that incorporate these are included. However, certain functionality in the imported contracts isn't used, so isn't included in any of the tests.

  The tests are defined in ```test/SEBounty.test.js```.

---
* **Tests are properly structured**

  The tests are Javascript-based (**not** Solidity-based), and are run using the Truffle framework. The test file is in Mocha format, so explanations of the tests are included in the `it()` statements.

---
* **Tests provide adequate coverage for the contract**

  In my opinion, they do. Happy to close any gaps spotted by others.

---
* **All tests pass**

  To run the tests, certain dependencies must be preset.

  Truffle:
  ```
  npm install -g truffle
  ```

  Ganache:

  This should be installed as per the instructions, [here](https://truffleframework.com/docs/ganache/quickstart#ganache).

  Ethereum Bridge:
  ```
  git clone https://github.com/oraclize/ethereum-bridge.git
  cd ethereum-bridge
  npm install
  ```
  Once ```ethereum-bridge``` is installed, it must be run in a separate terminal prior to the tests being run. From the install directory the following should be run, substituting the port to correspond to Ganache's port as necessary:
  ```
  ./ethereum-bridge -H localhost:7545 -a 9
  ```

  The ```ethereum-bridge``` package is required to allow the testing of Oraclize-dependent code. When the contract calls ```oraclize_query()```, the bridge allows the test framework to connect to Oraclize to perform the query, and supply a route for Oraclize's callback.

  An an example of a successful bridge bring-up is shown below:
  ```
  $ ./ethereum-bridge -H localhost:7545 -a 9
  Please wait...
  [2018-08-21T19:35:25.711Z] INFO you are running ethereum-bridge - version: 0.6.1
  [2018-08-21T19:35:25.711Z] INFO saving logs to: ./bridge.log
  [2018-08-21T19:35:25.712Z] INFO using active mode
  [2018-08-21T19:35:25.712Z] INFO Connecting to eth node http://localhost:7545
  [2018-08-21T19:35:26.945Z] INFO connected to node type EthereumJS TestRPC/v2.1.5/ethereum-js
  [2018-08-21T19:35:27.215Z] WARN Using 0xda565a9de768e183c2204c3aba7b549e53191ddf to query contracts on your blockchain, make sure it is unlocked and do not use the same address to deploy your contracts
  [2018-08-21T19:35:27.278Z] INFO deploying the oraclize connector contract...
  [2018-08-21T19:35:37.581Z] INFO connector deployed to: 0x6f8fe7bce48972ac12fb495a157fcaf00cbaf200
  [2018-08-21T19:35:37.644Z] INFO deploying the address resolver with a deterministic address...
  [2018-08-21T19:35:58.488Z] INFO address resolver (OAR) deployed to: 0x6f485c8bf6fc43ea212e93bbf8ce046c7f1cb475
  [2018-08-21T19:35:58.488Z] INFO updating connector pricing...
  [2018-08-21T19:36:09.151Z] INFO successfully deployed all contracts
  [2018-08-21T19:36:09.153Z] INFO instance configuration file saved to /home/richard/Projects/consensys-academy-project/ethereum-bridge/config/instance/oracle_instance_20180821T203609.json

  Please add this line to your contract constructor:

  OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);

  [2018-08-21T19:36:09.157Z] WARN re-org block listen is disabled while using TestRPC
  [2018-08-21T19:36:09.157Z] WARN if you are running a test suit with Truffle and TestRPC or your chain is reset often please use the --dev mode
  [2018-08-21T19:36:09.158Z] INFO Listening @ 0x6f8fe7bce48972ac12fb495a157fcaf00cbaf200 (Oraclize Connector)

  (Ctrl+C to exit)
  ```

  The tests can then be run using:
  ```
  truffle test
  ```

  Note that during the tests there are 3 delays, equating to the times that the tests call Oraclize. These delays are commented in the tests, and should last for 25 seconds each.

---
### Design Pattern Requirements
* **Implement a circuit breaker / emergency stop**

  Yes. The main contract imports `Pausable.sol`, and protects all major functions with a `whenNotPaused()` modifier.

* **What other design patterns have you used or not used?**

  See the above [Design Patterns](#design-patterns) section.

### Security Tools / Common Attacks
* **Explain what measures you have taken to ensure that the contracts are no susceptible to common attacks**

  See the above [Security and Common Attack Mitigation](#security-and-common-attack-mitigation) section.

### Library / EthPM
* **At least one of the projec contacts includes an import from a library/contract or an EthPM package**

  The main contract imports the following contracts:
   * Ownable.sol
   * Pausable.sol
   * Destructible.sol

  And the following library:
   * SafeMath.sol

### Additional Requirements
* **Smart contract code should be commented according to the specs in the Solidity documentation**

  Yes. Note that I haven't used NatSpec-style (Doxygen) comments on code that isn't a function definition, as this isn't supported (see Solidity issue [#3418](https://github.com/ethereum/solidity/issues/3418)). Where NatSpec isn't supported I've used bog-standard comment format.

### Stretch Goals
* **Project uses IPFS**

  **YES**: (Well, kinda.) This project tangentially uses IPFS to host the image on the main splash page. It doesn't use IPFS for its main functionality.

* **Project uses uPort**

  **NO**: This project does **not** use uPort.

* **Project uses the Ethereum Name Service**

  **NO**: This project does **not** use ENS.

* **Project uses an Oracle**

  **YES**: Oraclize is integral to this project's functionality, and is used to query Stack Exchange to check bounties are being posted on valid Stack Exchange questions.

* **Project implements an Upgradeable Pattern Registry or Delegation**

  **NO**: This project does **not** implement any kind of upgradeable pattern.

* **Project includes one of the smart contracts  implemented in LLL / Vyper**

  I've reimplemented the SafeMath library in Vyper, though with no serious rigour.

  The code can be found in `vyper/SafeMath.vy`.

  I wasn't able to get Vyper and Solidity contracts to co-compile in a single `truffle compile` (even with some digging), so for now I've directly copied the bytecode which was output by the https://vyper.online/ tool. This can be found at the bottom of the `.vy` file.

  Note that for the sake of being able to run the Truffle tests, the Vyper bytecode currently isn't hooked up to the project.

* **Testnet deployment: The addresses provided in deployed_addresses.txt correctly point to deployed contract on Rinkeby**

  **YES**: See [`deployed_addresses.txt`](deployed_addresses.txt) for the address.

---
## Future Improvements

The current implementation could be enhanced in various ways.

#### Small things
 * Allow open bounties to be edited.
 * Allow bounties to be posted in ERC-20 tokens. (Note: I did actually implement this, but removed it because there was no easy way to list the tokens available on Rinkeby, nor test in Ganache. This would be fairly easy to do on the mainnet where there exist digests of token addresses.)
 * Extend the dapp to cover any and all Stack Exchange sites, not just the Ethereum site.

#### Big things
 * Allow bounties to be traded as ERC-721 tokens.
