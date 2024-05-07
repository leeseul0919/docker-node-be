const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;

// MongoDB 연결 설정
const DB_URL = "mongodb+srv://OS:MZWl4yS6ylx53ouQ@os.xcm3kqz.mongodb.net/?retryWrites=true&w=majority&appName=OS";
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
const userSchema = new Schema({
    ID: String,
    Password: String,
    Guide_checksum: Number,
    Current_position_x: Number,
    Current_position_y: Number,
    Destination_ID: Number,
    Manager_check: Number
});
const Obstacle = mongoose.model('Obstacle', obstacleSchema);
const User = mongoose.model('user', userSchema);

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
        }
        const message = JSON.stringify(dataToSend);

        // 연결된 모든 클라이언트에게 메시지 전송
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
        console.log(changeEvent.operationType)
        
    });
}
wss.on('connection', (ws) => {
    console.log('Client connected!');

    // 클라이언트로부터 메시지를 받았을 때 처리
    ws.on('message', async (message) => {
        console.log('Received message from client:', message);

        try {
            // JSON 형식의 메시지 파싱
            const data = JSON.parse(message);
            console.log(data.progress_st);
            if (data.progress_st === "1") {
                const { nickname, password } = data;
                const existingUser = await User.findOne({ ID: nickname });
                if (existingUser) {
                    ws.send('2');
                }
                else {
                    const newUser = new User({
                        ID: nickname,
                        Password: password,
                        Guide_checksum: 0,
                        Current_position_x: 0,
                        Current_position_y: 0,
                        Destination_ID: -1,
                        Manager_check: 0
                    });
                    await newUser.save();
            
                    console.log('Data saved to MongoDB:', newUser);
                    ws.send('1');
                }
            }
            else if (data.progress_st === "2") {
                const { obs_id, start_x, start_z, end_x, end_z } = data;
                console.log('obstacle create data receive');
                const newObstacle = new Obstacle({
                        obs_id: obs_id,
                        start_x: start_x,
                        start_z: start_z,
                        end_x: end_x,
                        end_z: end_z,
                    });
                    await newObstacle.save();
            
                    console.log('obstacle data save');
            }
            else if(data.progress_st === "3") {
                const { obs_id, start_x, start_z, end_x, end_z } = data;
                console.log('obstacle delete data receive');
                const deletedObstacle = await Obstacle.findOneAndDelete({ obs_id: obs_id, start_x: start_x, start_z: start_z, end_x: end_x, end_z: end_z });
                if (deletedObstacle) {
                    let deletedata_send;
                    console.log('Obstacle deleted:', deletedObstacle);
                    deletedata_send = {
                        st: 2,
                        obs_id: obs_id,
                        start_x: start_x,
                        start_z: start_z,
                        end_x: end_x,
                        end_z: end_z
                    };
                    const message = JSON.stringify(deletedata_send);
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(message);
                        }
                    });
                }
                else {
                    console.log('Obstacle not found:', obs_id);
                }
                console.log('obstacle data delete');
            }
        } catch (error) {
            console.error('Error parsing message or saving data to MongoDB:', error);
        }
    });
});

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
    console.log('start');
});
