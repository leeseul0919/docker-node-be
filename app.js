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

async function watchCollectionChanges() {
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const changeStream = collection.watch();

  changeStream.on('change', (changeEvent) => {
    res.send('change')
    console.log("Change detected in collection:", changeEvent);

    let dataToSend;

    if (changeEvent.operationType === "insert") {
      dataToSend = {
        st: 1,
        obs_id: changeEvent.fullDocument.obs_id,
        start_x: changeEvent.fullDocument.start_x,
        start_z: changeEvent.fullDocument.start_z,
        end_x: changeEvent.fullDocument.end_x,
        end_z: changeEvent.fullDocument.end_z
      };
    } else if (changeEvent.operationType === "delete") {
      dataToSend = {
        st: 2,
        obs_id: changeEvent.documentKey.obs_id
      };
    }

    // 클라이언트에게 메시지 전송
    const message = JSON.stringify(dataToSend);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
}

app.get('/', (req, res) => {
  res.send('Hello, Cloudtype!')
})

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}`)
  console.log('start')
  await watchCollectionChanges();
})
