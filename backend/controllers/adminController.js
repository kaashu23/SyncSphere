const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalChats = await Chat.countDocuments();
    const totalMessages = await Message.countDocuments();
    
    // Estimate active users from socket connections
    const io = req.app.get('io');
    const activeUsers = io && io.sockets && io.sockets.sockets ? io.sockets.sockets.size : 0;
    
    // Mock pending reports since there's no model for it yet
    const pendingReports = 0;

    res.json({
      totalUsers,
      activeUsers,
      totalChats,
      totalMessages,
      pendingReports
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find().populate('users', 'firstName lastName email imageUrl').sort({ updatedAt: -1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const exportChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate('users', 'firstName lastName email');
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const messages = await Message.find({ chat: chat._id }).populate('sender', 'firstName lastName email').sort({ createdAt: 1 });
    
    // Send as JSON file
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=chat-export-${chat._id}.json`);
    
    res.json({
      chat: {
        id: chat._id,
        isGroupChat: chat.isGroupChat,
        chatName: chat.chatName,
        users: chat.users
      },
      messages: messages.map(m => ({
        id: m._id,
        sender: m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : 'System',
        content: m.content,
        type: m.type,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats, getAllChats, exportChat, getAllUsers };
