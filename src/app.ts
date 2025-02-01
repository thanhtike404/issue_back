import express, { Application, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import http from 'http';
import socketIo from 'socket.io';
import { socketInit } from './socket';

import dotenv from 'dotenv';

dotenv.config();

// Initialize Express App
const app: Application = express();
const port: number = parseInt(process.env.PORT || '4001', 10);

// Create an HTTP server and bind Socket.io to it
const server = http.createServer(app);
const io = new socketIo.Server(server, {
  // You can pass options here, like CORS settings
  cors: {
    origin: '*', // Replace with your front-end URL in production
    methods: ['GET', 'POST'],
  },
});
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req: any, res: any) => {
  return res.json({
    msg: 'hello'
  })
})
socketInit(io);


// Start the server
server.listen(port, () => {
  console.log(`App running on port ${port}`);
});
