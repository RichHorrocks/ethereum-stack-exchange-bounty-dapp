const SEBounty = artifacts.require('./SEBounty');

contract('SEBounty', function (accounts) {

  let bounty;

  beforeEach('setup contract for each test', async () => {
    bounty = await SEBounty.deployed();
  });

  it('has an owner', async () => {
    const owner = await bounty.owner.call();
    assert.equal(owner, accounts[0]);
  });

  it('creates a new bounty', async () => {
    const receipt = await bounty.createBounty('Test bounty', 1234, {
      value: '100',
      from: accounts[0],
    });

    // Check the bounty is created.
    const newBounty = await bounty.bounties.call(0);
    assert.equal(newBounty[0], 'Test bounty');
    assert.equal(newBounty[1].toNumber(), 1234);
    assert.equal(newBounty[2].toNumber(), 100);
    assert.equal(newBounty[3], accounts[0]);

    // Check the bounty value is added to the contract.
    const balance = await web3.eth.getBalance(bounty.address);
    assert.equal(balance, 100);

    // Check a log is written.
    assert.equal(
      receipt.logs.length,
      1,
      'triggers one event');
    assert.equal(
      receipt.logs[0].event,
      'BountyOpened',
      'should be a "BountyOpened" event');
    assert.equal(
      receipt.logs[0].args.bountyOwner,
      accounts[0],
      'should be owned by account[0]');
  });

  it('cancels a bounty', async () => {
    // Attempt with a non-owner account.
    try {
      await bounty.cancelBounty(0, { from: accounts[1] });
      assert(false);
    } catch (err) {
      assert(err);
    }

    // Attempt with the owner account.
    const receipt = await bounty.cancelBounty(0, { from: accounts[0] });

    // Check a log is written.
    assert.equal(
      receipt.logs.length,
      1,
      'triggers one event');
    assert.equal(
      receipt.logs[0].event,
      'BountyCancelled',
      'should be a "BountyCancelled" event');

  });

  it('withdraws from bounty', async () => {
    // Attempt to cancel the same bounty a second time.
    // Attempt with a non-owner account.
    try {
      await bounty.cancelBounty(0, { from: accounts[0] });
      assert(false);
    } catch (err) {
      assert(err);
    }

    // Attempt to withdraw wwith a non-owner account.
    try {
      await bounty.withdrawBounty(0, { from: accounts[1] });
      assert(false);
    } catch (err) {
      assert(err);
    }

    // Attempt with the owner account.
    const receipt = await bounty.withdrawBounty(0, { from: accounts[0] });

    // Check a log is written.
    assert.equal(
      receipt.logs.length,
      1,
      'triggers one event');
    assert.equal(
      receipt.logs[0].event,
      'BountyWithdrawn',
      'should be a "BountyWithdrawn" event');

    // Check the value held by the contract is now 0.
    const balance = await web3.eth.getBalance(bounty.address);
    assert.equal(balance, 0);
  });

});
