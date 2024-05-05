const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

// MongoDB 연결 설정
const DB_URL = "mongodb+srv://capstone:20211275@cluster0.ynjxsbf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
        watchCollectionChanges();
    })
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// MongoDB 스키마 정의
const Schema = mongoose.Schema;
const obstacleSchema = new Schema({
    obs_id: Number,
    start_x: Number,
    start_z: Number,
    end_x: Number,
    end_z: Number
});
const Obstacle = mongoose.model('Obstacle', obstacleSchema);

// 컬렉션 모니터링 및 WebSocket 전송
async function watchCollectionChanges() {
    app.get('/', (req, res) => {
        res.send('Hello, Cloudtype! MongoDB connected!');
    });

    const changeStream = Obstacle.watch();

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

        console.log(changeEvent.operationType)
    });
}

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log('start');
});
