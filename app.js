const express = require('express')
const http = require('http');
const WebSocket = require('ws');

const app = express()
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000

const MongoClient = require('mongodb').MongoClient;
var db;
const DB_URL = "mongodb+srv://capstone:20211275@cluster0.ynjxsbf.mongodb.net/"

MongoClient.connect(DB_URL, function(err, client) {
    if(err) return console.log(err);
    db = client.db('test');
    console.log('mongodb connect');
    app.get('/', (req, res) => {
        res.send('Hello, Cloudtype! MongoDB connected!');
    });
    //watchCollectionChanges();
});

async function watchCollectionChanges() {
    const collection = db.collection(COLLECTION_NAME);
    const changeStream = collection.watch();

    changeStream.on('change', (changeEvent) => {
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

app.listen(port || 8080, () => {
    console.log(`Example app listening on port ${port}`)
    console.log('start')
});
