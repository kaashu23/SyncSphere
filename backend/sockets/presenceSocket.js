const mongoose = require('mongoose');
const User = require('../models/User');

module.exports = (socket, io) => {
  socket.on('join', async ({ userId }) => {
    if (userId) {
      socket.userId = userId;
      socket.join(userId);
      console.log(`User ${userId} joined their personal room`);

      try {
        const query = mongoose.Types.ObjectId.isValid(userId) 
          ? { $or: [{ clerkId: userId }, { _id: userId }] }
          : { clerkId: userId };

        const user = await User.findOneAndUpdate(
          query,
          { status: 'online' },
          { new: true }
        );

        if (user) {
          io.emit('presence:update', { 
            userId: user._id, 
            clerkId: user.clerkId,
            status: 'online', 
            lastSeenAt: user.lastSeenAt 
          });
        }
      } catch (err) {
        console.error('Error updating presence on join:', err.message);
      }
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    if (socket.userId) {
      try {
        const query = mongoose.Types.ObjectId.isValid(socket.userId) 
          ? { $or: [{ clerkId: socket.userId }, { _id: socket.userId }] }
          : { clerkId: socket.userId };

        const user = await User.findOneAndUpdate(
          query,
          { status: 'offline', lastSeenAt: new Date() },
          { new: true }
        );

        if (user) {
          io.emit('presence:update', { 
            userId: user._id, 
            clerkId: user.clerkId,
            status: 'offline', 
            lastSeenAt: user.lastSeenAt 
          });
        }
      } catch (err) {
        console.error('Error updating presence on disconnect:', err.message);
      }
    }
  });

  socket.on('typing:start', ({ chatId, users, userId }) => {
    if (users && Array.isArray(users)) {
      users.forEach(u => {
        const targetRoom = u.clerkId || u._id;
        if (targetRoom && targetRoom.toString() !== userId.toString()) {
          io.to(targetRoom.toString()).emit('typing', { chatId, userId, isTyping: true });
        }
      });
    }
  });

  socket.on('typing:stop', ({ chatId, users, userId }) => {
    if (users && Array.isArray(users)) {
      users.forEach(u => {
        const targetRoom = u.clerkId || u._id;
        if (targetRoom && targetRoom.toString() !== userId.toString()) {
          io.to(targetRoom.toString()).emit('typing', { chatId, userId, isTyping: false });
        }
      });
    }
  });
};
