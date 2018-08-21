# consensys-academy-project



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

The tests are defined in ```SEBounty.test.js```.

---
* **Tests are properly structured**

The tests are Javascript-based (**not** Solidity-based), and are run using the Truffle framework.

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
```
npm install -g ganache-cli
```

Ethereum Bridge:
```
git clone https://github.com/oraclize/ethereum-bridge.git
cd ethereum-bridge
npm install
```
Once ```ethereum-bridge``` is installed, it must be run in a separate terminal prior to the tests being run. From the install directory the following should be run, substituting the port to correspond to Ganache's port as necessary:
```
./ethereum-bridge -H localhost:8545 -a 9
```

The ```ethereum-bridge``` package is required to allow the testing of Oraclize-dependent code. When the contract calls ```oraclize_query()```, the bridge allows the test framework to connect to Oraclize to perform the query, and supply a route for Oraclize's callback.

---
### Design Pattern Requirements
* **Implement a circuit breaker / emergency stop**

* **What other design patterns have you used or not used?**

### Security Tools / Common Attacks
* **Explain what measures you have taken to ensure that the contracts are no susceptible to common attacks**

### Library / EthPM
* **At least one of the projec contacts includes an import from a library/contract or an EthPM package**

### Additional Requirements
* **Smart contract code should be commented according to the specs in the Solidity documentation**

### Stretch Goals
* **Project uses IPFS**

YES: (Well, kinda.) This project tangentially uses IPFS to host the image on the main splash page. It doesn't use IPFS for its main functionality.

* **Project uses uPort**

NO: This project does **not** use uPort.

* **Project uses the Ethereum Name Service**

NO: This project does **not** use ENS.

* **Project uses an Oracle**

YES: Oraclize is integral to this project's functionality, and is used to query Stack Exchange to check bounties are being posted on valid Stack Exchange questions.

* **Project implements an Upgradeable Pattern Registry or Delegation**

NO: This project does **not** implement any kind of upgradeable pattern.

* **Project includes one of the smart contracts  implemented in LLL / Vyper**

* **Testnet deployment: The addresses provided in deployed_addresses.txt correctly point to deployed contract on Rinkeby**

YES: See deployed_addresses.txt for the address.
