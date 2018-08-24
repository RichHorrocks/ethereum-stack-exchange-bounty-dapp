# Security and Common Attack Mitigation

Certain of the design features mentioned above aim to mitigate certain attacks.

 * State machine: Helps prevent re-entrancy.
 * Checks-Effects-Interactions: Helps prevent re-entrancy.

In addition to reentrancy, the following are also mitigated against:

 * **Integer overflow**

   SafeMath.sol is used in certain places to prevent overflow, though in reality, more ETH than exists would be required to overflow in these cases.

 * **DoS (causing a revert)**

   When a bounty is awarded in `awardBounty()`, the winner must call a further function, `claimBounty()` to withdraw their prize. We are therefore favouring pull payments over push payments, which ensures the receiving address is able to receive (because they initiated the withdrawal).
