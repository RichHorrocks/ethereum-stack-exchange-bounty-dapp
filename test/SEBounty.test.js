const SEBounty = artifacts.require('./SEBounty');
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('SEBounty', (accounts) => {
  let bounty;
  let tx;
  const bountyAccount = accounts[0];
  const answerAccount1 = accounts[1];
  const answerAccount2 = accounts[2];

  const bountyValue = 50000000000000000;
  const bountyDescription = 'This is the bouny test string';
  const bountyQuestionId = 3;

  // Get a reference to the deployed contract before each test.
  beforeEach('setup contract for each test', async () => {
    bounty = await SEBounty.deployed();
  });

  describe('1. Bounty Contract', () => {
    describe('a. Initialisation', () => {
      it('funds the contract', async function () {
        bounty.sendTransaction({
          value: web3.toWei(10, 'ether'),
          from: accounts[0],
        });
      });

      it('has an owner', async function () {
        const owner = await bounty.owner.call();
        assert.equal(owner, accounts[0]);
      });
    });

    describe('b. Posting a bounty', () => {

      it('creates a new bounty and calls Oraclize', async function () {
        tx = await bounty.postBounty(
          bountyDescription,
          bountyQuestionId,
          {
            value: bountyValue,
            from: bountyAccount,
          });

        truffleAssert.eventEmitted(tx, 'newOraclizeQuery', (ev) => {
          return ev.caller === bountyAccount;
        });

        console.log('Waiting for the Oraclize callback to be called...');
        //this.timeout(20 * 1000);
        await new Promise(r => setTimeout(() => r(), 20000));

        // Check the bounty is created.
        const newBounty = await bounty.bounties.call(0);
        assert.equal(newBounty[0], bountyDescription);
        assert.equal(newBounty[1].toNumber(), bountyQuestionId);
        assert.equal(newBounty[2].toNumber(), bountyValue);
        assert.equal(newBounty[3], bountyAccount);

        // Check the bounty value is added to the contract.
        //const balance = await web3.eth.getBalance(bounty.address);
        //assert.equal(balance.toNumber(), 50000000000000000);
        //const foo = await bounty.cancelBounty(0, { from: accounts[0] });

      });

      it('creates a new bounty and calls Oraclize', async function () {

      });

      it('creates a new bounty and calls Oraclize', async function () {

      });
    });

    describe('c. Posting an answer', () => {
      it('posts an answer to an open bounty', async () => {

        tx = await bounty.postAnswer(0, 1234, { from: answerAccount1 });

        truffleAssert.eventEmitted(tx, 'AnswerPosted', (ev) => {
          return ev.answerOwner === answerAccount1;
        });

        // Check the answer count.
        const count = await bounty.getAnswerCount.call(0);
        assert.equal(count.toNumber(), 1);
      });

      it('posts an answer to an open bounty from a different account',
         async () => {
        tx = await bounty.postAnswer(0, 2345, { from: answerAccount2 });

        truffleAssert.eventEmitted(tx, 'AnswerPosted', (ev) => {
          return ev.answerOwner === answerAccount2;
        });

        // Check the answer count.
        const count = await bounty.getAnswerCount.call(0);
        assert.equal(count.toNumber(), 2);
      });

      it("checks that a user can't post the same answer twice", async () => {
        try {
          await bounty.postAnswer(0, 2345, { from: answerAccount2 });
        } catch (err) {
          assert(err.message.indexOf('revert') >= 0);
        }
      });


    });

    describe('d. Cancelling an answer', () => {
      it("stops a user cancelling another user's answer", async () => {
        try {
          await bounty.cancelAnswer(0, 0, { from: answerAccount2 });
        } catch (err) {
          assert(err.message.indexOf('revert') >= 0);
        }
      });

      it('cancels an answer to an open bounty', async () => {
        await bounty.cancelAnswer(0, 1, { from: answerAccount2 });

        // Check the answer count.
        const count = await bounty.getAnswerCount.call(0);
        assert.equal(count.toNumber(), 1);
      })

    });

    describe('e. Awarding a bounty', () => {
      it('awards a bounty', async () => {
        tx = await bounty.awardBounty(0, 0, {from: bountyAccount });

        truffleAssert.eventEmitted(tx, 'BountyAwarded');
      });

      it("checks that answers can't be posted once a bounty is awarded",
         async () => {
        try {
          await bounty.postAnswer(0, 3456, { from: answerAccount2 });
        } catch (err) {
          assert(err.message.indexOf('revert') >= 0);
        }
      });
    });

    describe('f. Claiming a bounty', () => {


    });

    describe('g. Cancelling a bounty', () => {


    });

  });



  //
  // });
  //
  //

  //

  //
  //
  // it("checks that a users can't claim another user's bounty", async () => {
  //   try {
  //     const receipt = await bounty.claimBounty(0, { from: accounts[2] });
  //   } catch (err) {
  //     assert(err.message.indexOf('revert') >= 0);
  //   }
  // });
  //
  // it('allows the bounty winner to claim the bounty', async () => {
  //   const receipt = await bounty.claimBounty(0, { from: accounts[1] });
  //
  //   // Check a log is written.
  //   assert.equal(
  //     receipt.logs.length,
  //     1,
  //     'triggers one event');
  //   assert.equal(
  //     receipt.logs[0].event,
  //     'BountyClaimed',
  //     'should be a "BountyClaimed" event');
  // });

  // it('cancels a bounty', async () => {
  //   // Attempt to cancel the open bounty from a non-owner account.
  //   try {
  //     await bounty.cancelBounty(0, { from: accounts[1] });
  //   } catch (err) {
  //     assert(err.message.indexOf('revert') >= 0);
  //   }
  //
  //   // Attempt to cancel the open bounty from the owner account.
  //   const receipt = await bounty.cancelBounty(0, { from: accounts[0] });
  //
  //   // Check a log is written.
  //   assert.equal(
  //     receipt.logs.length,
  //     1,
  //     'triggers one event');
  //   assert.equal(
  //     receipt.logs[0].event,
  //     'BountyCancelled',
  //     'should be a "BountyCancelled" event');
  //
  //   // Check the value held by the contract is now 0.
  //   //const balance = await web3.eth.getBalance(bounty.address);
  //   //assert.equal(balance.toNumber(), 0);
  // });

  describe('2. SafeMath Library', () => {
    it('prevents overflow', () => {


    });

    it('prevents underflow', () => {


    });

  });

  describe('3. Pausable Contract', () => {
    it('stops a non-owner pausing the contract', () => {


    });

    it('lets the owner pause the contract in an emergency', async () => {
      // Pause the contract.
      const tx = await bounty.pause({ from: accounts[0] });

      truffleAssert.eventEmitted(tx, 'Pause');

      // Attempt to post a bounty.
      try {
        await bounty.postBounty(
          bountyDescription,
          bountyQuestionId,
          {
            from: bountyAccount,
            value: bountyValue
          });
      } catch (err) {
        assert(err.message.indexOf('revert') >= 0);
      }
    });

    it('stops a non-owner unpausing the contract', () => {


    });

    it('lets the owner unpause the contract', () => {


    });

  });

  describe('4. Destructible Contract', () => {

    it('stops a non-owner killing the contract', () => {


    });

    it('lets the owner kill the contract', () => {


    });


  });


});
