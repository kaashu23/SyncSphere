require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // update to your frontend origin in production
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: true, // Allow any origin, reflecting it back to support credentials
  credentials: true
}));

// Webhook route needs raw body, so place it before express.json()
app.use('/api/auth', require('./routes/authRoutes'));

app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Setup routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chats', require('./routes/chatRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/status', require('./routes/statusRoutes'));
app.use('/api/calls', require('./routes/callRoutes'));

// Basic Route
app.get('/', (req, res) => {
  res.send('SyncSphere API is running...');
});

require('./sockets')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
