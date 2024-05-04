const express = require('express')
const http = require('http');
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');

const app = express()
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000

const MONGODB_URI = "mongodb://capstone:20211275@atlas-sql-662e8edb701bc6704f5f31ae-oj1se.a.query.mongodb.net/test?ssl=true&authSource=admin";
const DATABASE_NAME = "test";
const COLLECTION_NAME = "obstacles";

const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
wss.on('connection', function connection(ws) {
  console.log('Client connected');

  ws.on('close', function() {
    console.log('Client disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Hello, Cloudtype!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
