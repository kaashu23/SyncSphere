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

// Basic Route
app.get('/', (req, res) => {
  res.send('SyncSphere API is running...');
});

// Setup socket events
io.on('connection', (socket) => {
  console.log('Connected to socket.io');

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User Joined Room: ' + room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;
      socket.in(user.clerkId || user._id).emit('message recieved', newMessageRecieved);
    });
  });

  socket.on('mark read', ({ chatId, users }) => {
    if (!users) return;
    users.forEach((u) => {
      socket.in(u.clerkId || u._id).emit('messages read', chatId);
    });
  });

  socket.on('delete message', ({ messageId, users }) => {
    if (!users) return;
    users.forEach((u) => {
      socket.in(u.clerkId || u._id).emit('message deleted', messageId);
    });
  });

  socket.on('message reaction', ({ message, users }) => {
    if (!users) return;
    users.forEach((u) => {
      socket.in(u.clerkId || u._id).emit('message reacted', message);
    });
  });

  socket.on('message edit', ({ message, users }) => {
    if (!users) return;
    users.forEach((u) => {
      socket.in(u.clerkId || u._id).emit('message edited', message);
    });
  });

  socket.on('message star', ({ message, users }) => {
    if (!users) return;
    users.forEach((u) => {
      socket.in(u.clerkId || u._id).emit('message starred', message);
    });
  });

  socket.on('typing:start', ({ chatId, userId, users }) => {
    if (!users) return;
    users.forEach((u) => {
      if (u.clerkId !== userId && u._id !== userId) {
        socket.in(u.clerkId || u._id).emit('typing:start', { chatId, userId });
      }
    });
  });

  socket.on('typing:stop', ({ chatId, userId, users }) => {
    if (!users) return;
    users.forEach((u) => {
      if (u.clerkId !== userId && u._id !== userId) {
        socket.in(u.clerkId || u._id).emit('typing:stop', { chatId, userId });
      }
    });
  });

  // --- WebRTC Signaling ---
  socket.on("call-user", (data) => {
    // data: { userToCall: clerkId/userId, signalData, from: myUserId, name: myName }
    socket.in(data.userToCall).emit("call-received", { 
      signal: data.signalData, 
      from: data.from, 
      callerName: data.name,
      isVideo: data.isVideo
    });
  });

  socket.on("answer-call", (data) => {
    // data: { to: callerId, signal: answerSignal }
    socket.in(data.to).emit("call-accepted", data.signal);
  });
  
  socket.on("end-call", (data) => {
    if(data.to) {
      socket.in(data.to).emit("call-ended");
    }
  });

  socket.on("ice-candidate", (data) => {
    socket.in(data.to).emit("ice-candidate", data.candidate);
  });

  socket.off('setup', () => {
    console.log('USER DISCONNECTED');
    socket.leave(userData._id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
