const routes = require('next-routes')();

routes
  .add('/bounties/new', '/bounties/new')
  .add('/bounties/explore', '/bounties/explore')
  .add('/bounties/:address/:id', '/bounties/show')
  .add('/dashboard/:address', '/dashboard');

module.exports = routes;
