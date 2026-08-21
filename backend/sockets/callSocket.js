module.exports = (socket, io) => {
  // 1-to-1 and Group Call Signaling

  socket.on("call:invite", (data) => {
    // data: { userToCall: clerkId/userId, signalData, from: myUserId, name: myName, isVideo: boolean, isGroup: boolean, chatId?: string }
    socket.in(data.userToCall).emit("call:offer", { 
      signal: data.signalData, 
      from: data.from, 
      callerName: data.name,
      isVideo: data.isVideo,
      isGroup: data.isGroup,
      chatId: data.chatId
    });
  });

  socket.on("call:answer", (data) => {
    // data: { to: callerId, signal: answerSignal, from: myUserId }
    socket.in(data.to).emit("call:accepted", {
      signal: data.signal,
      from: data.from
    });
  });
  
  socket.on("call:end", (data) => {
    if (data.to) {
      socket.in(data.to).emit("call:ended", { from: data.from });
    } else if (data.room) {
      // For group calls, broadcast to room
      socket.in(data.room).emit("call:ended", { from: data.from });
    }
  });

  socket.on("call:ice-candidate", (data) => {
    socket.in(data.to).emit("call:ice-candidate", {
      candidate: data.candidate,
      from: data.from
    });
  });
};
