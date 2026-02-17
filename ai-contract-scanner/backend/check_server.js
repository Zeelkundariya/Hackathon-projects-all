const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Connectivity OK');
});
server.listen(3001, '127.0.0.1', () => {
    console.log('✅ Connectivity Server running on http://127.0.0.1:3001');
});
server.on('error', (e) => {
    console.error('❌ Connectivity Server Error:', e);
});
