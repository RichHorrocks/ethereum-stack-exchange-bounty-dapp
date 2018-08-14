const SEBounty = artifacts.require('./SEBounty');
const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

contract('SEBounty', (accounts) => {
  let bounty;
  let tx;
  const bountyAccount1 = accounts[0];
  const bountyAccount2 = accounts[1];
  const answerAccount1 = accounts[2];
  const answerAccount2 = accounts[3];

  const bountyValue = 50000000000000000;
  const bountyQuestionId = 3;
  const bountyDescription1 = 'This is the first bounty test string';
  const bountyDescription2 = 'This is the second bounty test string';
  const bountyDescription3 = 'This is the third bounty test string';

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
          bountyDescription1,
          bountyQuestionId,
          {
            value: bountyValue,
            from: bountyAccount1,
          });

        truffleAssert.eventEmitted(tx, 'newOraclizeQuery', (ev) => {
          return ev.caller === bountyAccount1;
        });

        console.log('Waiting for the Oraclize callback to be called...');
        //this.timeout(20 * 1000);
        await new Promise(r => setTimeout(() => r(), 20000));

        // Check the bounty is created.
        const newBounty = await bounty.bounties.call(0);
        assert.equal(newBounty[0], bountyDescription1);
        assert.equal(newBounty[1].toNumber(), bountyQuestionId);
        assert.equal(newBounty[2].toNumber(), bountyValue);
        assert.equal(newBounty[3], bountyAccount1);
      });

      it('creates a second new bounty and calls Oraclize', async function () {
        tx = await bounty.postBounty(
          bountyDescription2,
          bountyQuestionId,
          {
            value: bountyValue,
            from: bountyAccount2,
          });

        truffleAssert.eventEmitted(tx, 'newOraclizeQuery', (ev) => {
          return ev.caller === bountyAccount2;
        });

        console.log('Waiting for the Oraclize callback to be called...');
        //this.timeout(20 * 1000);
        await new Promise(r => setTimeout(() => r(), 20000));

        // Check the bounty is created.
        const newBounty = await bounty.bounties.call(1);
        assert.equal(newBounty[0], bountyDescription2);
        assert.equal(newBounty[1].toNumber(), bountyQuestionId);
        assert.equal(newBounty[2].toNumber(), bountyValue);
        assert.equal(newBounty[3], bountyAccount2);
      });

      it('creates a third new bounty and calls Oraclize', async function () {
        tx = await bounty.postBounty(
          bountyDescription3,
          bountyQuestionId,
          {
            value: bountyValue,
            from: bountyAccount2,
          });

        truffleAssert.eventEmitted(tx, 'newOraclizeQuery', (ev) => {
          return ev.caller === bountyAccount2;
        });

        console.log('Waiting for the Oraclize callback to be called...');
        //this.timeout(20 * 1000);
        await new Promise(r => setTimeout(() => r(), 20000));

        // Check the bounty is created.
        const newBounty = await bounty.bounties.call(2);
        assert.equal(newBounty[0], bountyDescription3);
        assert.equal(newBounty[1].toNumber(), bountyQuestionId);
        assert.equal(newBounty[2].toNumber(), bountyValue);
        assert.equal(newBounty[3], bountyAccount2);
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
      it("stops a user awarding another user's bounty", async () => {
        try {
          await bounty.awardBounty(0, 0, { from: bountyAccount2 });
        } catch (err) {
          assert(err.message.indexOf('revert') >= 0);
        }
      });

      it('awards a bounty', async () => {
        tx = await bounty.awardBounty(0, 0, {from: bountyAccount1 });

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
      it("stops a user claiming another user's bounty", async () => {
          try {
            await bounty.claimBounty(0, { from: answerAccount2 });
          } catch (err) {
            assert(err.message.indexOf('revert') >= 0);
          }
      });

      it("lets a user claim their bounty", async () => {
        tx = await bounty.claimBounty(0, {from: answerAccount1 });

        truffleAssert.eventEmitted(tx, 'BountyClaimed');
      });
    });

    describe('g. Cancelling a bounty', () => {
      it("stops a user cancelling another user's bounty", async () => {
          try {
            await bounty.cancelBounty(1, { from: bountyAccount1 });
          } catch (err) {
            assert(err.message.indexOf('revert') >= 0);
          }
      });

      it("checks that a user can cancel their bounty", async () => {
        tx = await bounty.cancelBounty(1, { from: bountyAccount2 });

        truffleAssert.eventEmitted(tx, 'BountyCancelled');
      });

      it("checks that a user can't cancel an already-cancelled bounty",
         async () => {
        try {
          await bounty.cancelBounty(1, { from: bountyAccount2 });
        } catch (err) {
          assert(err.message.indexOf('revert') >= 0);
        }
      });
    });
  });

  // describe('2. SafeMath Library', () => {
  //   it('prevents overflow', () => {
  //
  //
  //   });
  //
  //   it('prevents underflow', () => {
  //
  //
  //   });
  // });

  describe('3. Pausable Contract', () => {
    it('stops a non-owner pausing the contract', async () => {
      try {
        await bounty.pause({ from: accounts[1] });
      } catch (err) {
        assert(err.message.indexOf('revert') >= 0);
      }
    });

    it('lets the owner pause the contract in an emergency', async () => {
      // Pause the contract.
      tx = await bounty.pause({ from: accounts[0] });

      truffleAssert.eventEmitted(tx, 'Pause');
    });

    it('stops a non-owner unpausing the contract', async () => {
      try {
        await bounty.unpause({ from: accounts[1] });
      } catch (err) {
        assert(err.message.indexOf('revert') >= 0);
      }
    });

    it('lets the owner unpause the contract', async () => {
      tx = await bounty.unpause({ from: accounts[0] });
      truffleAssert.eventEmitted(tx, 'Unpause');
    });
  });

  describe('4. Destructible Contract', () => {
    it('stops a non-owner killing the contract', async () => {
      try {
        await bounty.destroy({ from: accounts[1] });
      } catch (err) {
        assert(err.message.indexOf('revert') >= 0);
      }
    });
  });
});
