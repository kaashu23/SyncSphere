const Chat = require('../models/Chat');
const User = require('../models/User');

// Fetch all chats for a user
exports.fetchChats = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chats = await Chat.find({ users: { $elemMatch: { $eq: user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('archivedBy', 'clerkId')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    const chatsWithLatestMessageSender = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'displayName avatarUrl email',
    });

    res.status(200).json(chatsWithLatestMessageSender);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create or fetch 1-on-1 chat
exports.accessChat = async (req, res) => {
  const { userId } = req.body;
  const clerkId = req.headers['clerk-id'];

  if (!userId) {
    return res.status(400).json({ message: 'UserId param not sent with request' });
  }

  try {
    const currentUser = await User.findOne({ clerkId });

    let isChat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: currentUser._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    isChat = await User.populate(isChat, {
      path: 'latestMessage.sender',
      select: 'displayName avatarUrl email',
    });

    if (isChat.length > 0) {
      res.send(isChat[0]);
    } else {
      var chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [currentUser._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findOne({ _id: createdChat._id }).populate('users', '-password');
      res.status(200).json(fullChat);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Group Chat
exports.createGroupChat = async (req, res) => {
  const clerkId = req.headers['clerk-id'];

  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: 'Please Fill all the feilds' });
  }

  var users = JSON.parse(req.body.users);
  
  if (users.length < 2) {
    return res.status(400).send('More than 2 users are required to form a group chat');
  }

  try {
    const currentUser = await User.findOne({ clerkId });
    users.push(currentUser); // Add current user to group

    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: currentUser,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    await Chat.findByIdAndDelete(chatId);
    // Ideally delete messages too: await Message.deleteMany({ chat: chatId });
    res.status(200).json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.archiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isArchived = chat.archivedBy.includes(user._id);
    if (isArchived) {
      chat.archivedBy.pull(user._id);
    } else {
      chat.archivedBy.push(user._id);
    }
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.muteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isMuted = chat.mutedBy.includes(user._id);
    if (isMuted) {
      chat.mutedBy.pull(user._id);
    } else {
      chat.mutedBy.push(user._id);
    }
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
