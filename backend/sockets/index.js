module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join room
    socket.on('join', ({ userId }) => {
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} joined their personal room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
