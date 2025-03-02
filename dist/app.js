"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = __importDefault(require("socket.io"));
const socket_1 = require("./socket");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize Express App
const app = (0, express_1.default)();
const port = parseInt(process.env.PORT || '4000', 10);
// Create an HTTP server and bind Socket.io to it
const server = http_1.default.createServer(app);
const io = new socket_io_1.default.Server(server, {
    // You can pass options here, like CORS settings
    cors: {
        // origin: '', // Allow only your front-end to connect
        origin: '*', // Allow only your front-end to connect,
        methods: ['GET', 'POST'],
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.get('/', (req, res) => {
    return res.json({
        msg: 'hello fucking new world'
    });
});
(0, socket_1.socketInit)(io);
// Start the server
server.listen(port, () => {
    console.log(`App running on port ${port}`);
});
