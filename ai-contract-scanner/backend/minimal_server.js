const http = require('http');
const server = http.createServer((req, res) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', message: 'Minimal test server active' }));
});
server.listen(3001, '127.0.0.1', () => {
    console.log('🚀 Minimal test server running on http://127.0.0.1:3001');
});
