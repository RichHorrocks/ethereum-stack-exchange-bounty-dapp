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

A public version of the site is hosted at...

---
* **The application should have the following features:**
   * **Display the current Metamask account**
   
   On the first splash page, this can be found at the bottom, in the middle of the page. On all other pages, this can be found in the top bar.
   
   If the user selects a different account in Metamask, the page will automatically re-render.
   
   * **Sign transactions using Metamask**
   
   Any interaction with the contract that incurs a fee will present the user with the Metamask confirmation pop-up. Those interactions are posting or cancelling a bounty or an answer.
   
   * **Reflect updates to the contract state**
   
   Any creation or cancellation of bounties or answers are automatically reflected in the front end by way of a page re-rendering.
   
### Testing

* **5 tests with explanations for each smart contract written**

Only 1 contract was written from scratch: ```SEBounty.sol```. Other contracts are imported, and appropriate tests that incorporate these are included. However, certain functionality in the imported contracts isn't used, so isn't included in any of the tests.

The tests are defined in ```SEBounty.test.js```.

* **Tests are properly structured**

The tests are Javascript-based (**not** Solidity-based), and are run using the Truffle framework.

* **Tests provide adequate coverage for the contract**
