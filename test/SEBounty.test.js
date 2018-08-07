const SEBounty = artifacts.require('./SEBounty');

contract('SEBounty', function (accounts) {

  let bounty;

  beforeEach('setup contract for each test', async () => {
    bounty = await SEBounty.deployed();
  });

  it('funds the contract', async () => {
    bounty.sendTransaction({
      value: web3.toWei(10, 'ether'),
      from: accounts[0],
    })
  });

  it('has an owner', async () => {
    const owner = await bounty.owner.call();
    assert.equal(owner, accounts[0]);
  });

  it('creates a new bounty', async () => {
    const receipt = await bounty.postBounty('Test bounty', 3, {
      value: '50000000000000000',
      from: accounts[0],
    });

    // Check a log is written.
    assert.equal(
      receipt.logs.length,
      1,
      'triggers one event');
    assert.equal(
      receipt.logs[0].event,
      'newOraclizeQuery',
      'should be a "newOraclizeQuery" event');

    // Wait for the __callback method to be called.
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function demo() {
      console.log('Waiting for the Oraclize callback to be called...');
      await sleep(20000); // 20 seconds.
      console.log("Let's go!");
    }

    await demo();

    // Check that the appropriate event was emitted.
    // assert.equal(
    //   receipt.logs.length,
    //   1,
    //   'triggers one event');
    // assert.equal(
    //   receipt.logs[0].event,
    //   'OraclizeQuerySuccess',
    //   'should be a "OraclizeQuerySuccess" event');
    // assert.equal(
    //   receipt.logs[0].args.caller,
    //   accounts[0],
    //   'should be called by account[0]');

    // Check the bounty is created.
    const newBounty = await bounty.bounties.call(0);
    //assert.equal(newBounty[0], 'Test bounty');
    assert.equal(newBounty[1].toNumber(), 3);
    assert.equal(newBounty[2].toNumber(), 50000000000000000);
    assert.equal(newBounty[3], accounts[0]);

    // Check the bounty value is added to the contract.
    //const balance = await web3.eth.getBalance(bounty.address);
    //assert.equal(balance.toNumber(), 50000000000000000);
    console.log((await bounty.getBountyCount.call()).toNumber());
    const foo = await bounty.cancelBounty(0, { from: accounts[0] });

  });


  it('cancels a bounty', async () => {
    // Attempt with a non-owner account.
    // try {
    //   await bounty.cancelBounty(0, { from: accounts[1] });
    //   assert(false);
    // } catch (err) {
    //   assert(err);
    // }
    console.log((await bounty.getBountyCount.call()).toNumber());
    // const newBounty = await bounty.bounties.call(0);
    // console.log(newBounty[1].toNumber());
    // console.log(newBounty[2].toNumber());
    // console.log(newBounty[3]);

    // Attempt with the owner account.
    // try {
    //   const receipt = await bounty.cancelBounty(0, { from: accounts[0] });
    // } catch(err) {
    //   console.log(err);
    // }
    //
    // // Check a log is written.
    // assert.equal(
    //   receipt.logs.length,
    //   1,
    //   'triggers one event');
    // assert.equal(
    //   receipt.logs[0].event,
    //   'BountyCancelled',
    //   'should be a "BountyCancelled" event');

    // Check the value held by the contract is now 0.
  //  const balance = await web3.eth.getBalance(bounty.address);
  //  assert.equal(balance, 0);
  });
});
