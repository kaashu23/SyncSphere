module.exports = (socket, io) => {
  socket.on('message:send', ({ message }) => {
    if (!message || !message.chat || !message.chat.users) return;
    
    message.chat.users.forEach(user => {
      if (user._id.toString() === message.sender._id.toString() || user.clerkId === message.sender.clerkId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('message:new', message);
    });
  });

  socket.on('message:edit', ({ message }) => {
    if (!message || !message.chat || !message.chat.users) return;
    
    message.chat.users.forEach(user => {
      if (user._id.toString() === message.sender._id.toString() || user.clerkId === message.sender.clerkId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('message:updated', message);
    });
  });

  socket.on('message:delete', ({ messageId, chatId, users, senderId }) => {
    if (!users) return;
    
    users.forEach(user => {
      if (user._id.toString() === senderId.toString() || user.clerkId === senderId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('message:deleted', { messageId, chatId });
    });
  });

  socket.on('message:react', ({ message }) => {
    if (!message || !message.chat || !message.chat.users) return;
    
    message.chat.users.forEach(user => {
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('message:reaction', message);
    });
  });

  socket.on('message:seen', ({ chatId, messageIds, users, userId }) => {
    if (!users) return;
    
    users.forEach(user => {
      if (user._id.toString() === userId.toString() || user.clerkId === userId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('message:seen', { chatId, messageIds, userId });
    });
  });

  socket.on('typing:start', ({ chatId, userId, users }) => {
    if (!users) return;
    users.forEach(user => {
      if (user._id.toString() === userId.toString() || user.clerkId === userId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('typing:start', { chatId, userId });
    });
  });

  socket.on('typing:stop', ({ chatId, userId, users }) => {
    if (!users) return;
    users.forEach(user => {
      if (user._id.toString() === userId.toString() || user.clerkId === userId) return;
      const targetRoom = user.clerkId || user._id;
      io.to(targetRoom.toString()).emit('typing:stop', { chatId, userId });
    });
  });
};
