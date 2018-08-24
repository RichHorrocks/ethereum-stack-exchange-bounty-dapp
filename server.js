const { createServer } = require('http');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });

const routes = require('./routes');
const handler = routes.getRequestHandler(app);

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  createServer(handler).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on port ${port}...`);
  });
});
