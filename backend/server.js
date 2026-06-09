require('dotenv').config();
const http = require('http');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const { init } = require('./src/utils/socketLogic');
const io = init(server);

server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
