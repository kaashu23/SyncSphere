const presenceSocket = require('./presenceSocket');
const chatSocket = require('./chatSocket');
const callSocket = require('./callSocket');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Initialize modules
    presenceSocket(socket, io);
    chatSocket(socket, io);
    callSocket(socket, io);
  });
};
