const Message = require('../models/Message');

let connectedUsers = {};

const handleConnection = (socket) => {
  console.log('User connected:', socket.id);
  

  socket.on('authenticate', (token) => {


    socket.userId = token.userId;
    connectedUsers[socket.userId] = socket.id;
  });
  

  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content, messageType = 'text' } = data;
      const senderId = socket.userId;
      

      const message = await Message.create({
        senderId,
        receiverId,
        content,
        messageType
      });
      

      const recipientSocketId = connectedUsers[receiverId];
      if (recipientSocketId) {
        socket.to(recipientSocketId).emit('receiveMessage', {
          id: message.id,
          senderId,
          content,
          messageType,
          sentAt: message.sentAt
        });
      }
      

      socket.emit('messageSent', {
        id: message.id,
        receiverId,
        content,
        messageType,
        sentAt: message.sentAt
      });
    } catch (error) {
      socket.emit('errorMessage', { error: error.message });
    }
  });
  

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    for (const userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
};

module.exports = {
  handleConnection
};