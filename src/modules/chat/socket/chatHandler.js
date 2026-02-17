const Message = require('../models/Message');

let connectedUsers = {};

const handleConnection = (socket) => {
  console.log('User connected:', socket.id);
  
  // Handle user authentication
  socket.on('authenticate', (token) => {
    // Here you would typically verify the JWT token
    // For simplicity, we'll skip this in the example
    socket.userId = token.userId; // Assuming token was decoded elsewhere
    connectedUsers[socket.userId] = socket.id;
  });
  
  // Handle incoming messages
  socket.on('sendMessage', async (data) => {
    try {
      const { receiverId, content, messageType = 'text' } = data;
      const senderId = socket.userId;
      
      // Save message to database
      const message = await Message.create({
        senderId,
        receiverId,
        content,
        messageType
      });
      
      // Send message to recipient if they're online
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
      
      // Send confirmation back to sender
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
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from connected users
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