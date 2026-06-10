const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);

const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/health', (req, res) => {
    res.json({
        status: 'ok'
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`========================================`);
    console.log(`HTTP Server running on http://0.0.0.0:${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`LAN access: http://192.168.1.198:${PORT}`);
    console.log(`========================================`);
});