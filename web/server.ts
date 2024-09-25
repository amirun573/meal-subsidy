import 'module-alias/register';
import express from 'express';
import next from 'next';
import './cron';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.all('/api/*', (req, res) => {
    return handle(req, res); // Forward API requests to Next.js
  });

  server.all('*', (req, res) => {
    return handle(req, res); // Handle other requests
  });

  server.listen(3000, (err?: any) => {
    if (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    } else {
      console.log('> Ready on http://localhost:3000');
    }
  });
});
