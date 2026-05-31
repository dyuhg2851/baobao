const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const webpush = require('web-push');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = 'pUobpGQ1rHiG0M9T3djM1vN7vX5rY8hK9mL2cE4sQ6w=';
const VAPID_SUBJECT = 'mailto:admin@char.local';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let wsClients = new Set();
let pushSubscriptions = [];

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    wsClients.add(ws);

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        wsClients.delete(ws);
    });

    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        wsClients.delete(ws);
    });
});

function broadcast(message) {
    const data = JSON.stringify(message);
    wsClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

function sendPushNotification(title, body, data) {
    const payload = JSON.stringify({
        title: title,
        body: body,
        icon: 'https://i.postimg.cc/vBY98wDL/IMG-9251.jpg',
        badge: 'https://i.postimg.cc/vBY98wDL/IMG-9251.jpg',
        data: data || { url: '/Chat/chat-room.html' }
    });

    pushSubscriptions.forEach((sub) => {
        try {
            webpush.sendNotification(sub, payload)
                .then(() => console.log('Push sent successfully'))
                .catch((err) => {
                    console.error('Push error:', err);
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        const index = pushSubscriptions.indexOf(sub);
                        if (index > -1) {
                            pushSubscriptions.splice(index, 1);
                            console.log('Removed invalid subscription');
                        }
                    }
                });
        } catch (e) {
            console.error('Push send error:', e);
        }
    });
}

app.post('/receiveMsg', (req, res) => {
    const { message, from } = req.body;
    console.log('Received message:', message);

    broadcast({
        type: 'new_message',
        message: message,
        from: from || 'Char',
        timestamp: Date.now()
    });

    sendPushNotification(
        from || 'Char',
        message,
        { url: '/Chat/chat-room.html' }
    );

    res.json({ success: true });
});

app.post('/broadcast', (req, res) => {
    const { message, from } = req.body;
    console.log('Broadcasting:', message);

    broadcast({
        type: 'notification',
        message: message,
        from: from || 'System',
        timestamp: Date.now()
    });

    sendPushNotification(
        from || 'System',
        message,
        { url: '/Chat/chat-room.html' }
    );

    res.json({ success: true });
});

app.post('/push/subscribe', (req, res) => {
    const subscription = req.body;
    console.log('Push subscription received:', subscription.endpoint);

    const existingIndex = pushSubscriptions.findIndex(
        sub => sub.endpoint === subscription.endpoint
    );

    if (existingIndex === -1) {
        pushSubscriptions.push(subscription);
        console.log('New push subscription added. Total:', pushSubscriptions.length);
    } else {
        pushSubscriptions[existingIndex] = subscription;
        console.log('Push subscription updated');
    }

    res.json({ success: true });
});

app.post('/push/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    const index = pushSubscriptions.findIndex(sub => sub.endpoint === endpoint);
    if (index > -1) {
        pushSubscriptions.splice(index, 1);
        console.log('Push subscription removed. Total:', pushSubscriptions.length);
    }
    res.json({ success: true });
});

app.get('/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        wsClients: wsClients.size,
        pushSubscriptions: pushSubscriptions.length
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`HTTP Server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket Server running on ws://0.0.0.0:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`LAN access: http://192.168.1.198:${PORT}`);
    console.log(`========================================`);
    console.log(`Push notifications: ENABLED`);
    console.log(`Push subscriptions: ${pushSubscriptions.length}`);
    console.log(`========================================`);
});

wss.on('connection', (ws) => {
    console.log('New WebSocket connection on same server');
    wsClients.add(ws);

    ws.on('close', () => {
        wsClients.delete(ws);
    });
});