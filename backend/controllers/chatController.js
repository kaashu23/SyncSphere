const Chat = require('../models/Chat');
const User = require('../models/User');
const Message = require('../models/Message');

// Returns a fully populated chat for use after mutations
async function getPopulatedChat(chatId) {
  const chat = await Chat.findById(chatId)
    .populate('users', '-password')
    .populate('groupAdmin', '-password')
    .populate('admins', '-password')
    .populate('archivedBy', 'clerkId')
    .populate('latestMessage');
  return await User.populate(chat, {
    path: 'latestMessage.sender',
    select: 'displayName avatarUrl email',
  });
}

// Is the given user an admin of the chat (creator always counts)?
function isGroupAdmin(chat, user) {
  if (!user) return false;
  if (chat.groupAdmin && chat.groupAdmin.equals(user._id)) return true;
  if (Array.isArray(chat.admins)) {
    return chat.admins.some((a) => {
      const id = a && a._id ? a._id : a;
      return id && id.equals(user._id);
    });
  }
  return false;
}

// Save the chat and notify every member's socket room that the group changed
async function saveAndBroadcast(req, chat) {
  await chat.save();
  const fullChat = await getPopulatedChat(chat._id);
  try {
    const io = req.app.get('io');
    if (io && fullChat.users) {
      fullChat.users.forEach((u) => {
        const room = u.clerkId || u._id;
        if (room) io.to(room).emit('group updated', fullChat);
      });
    }
  } catch (err) {
    console.error('Error broadcasting group update:', err.message);
  }
  return fullChat;
}

// Fetch all chats for a user
exports.fetchChats = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chats = await Chat.find({ users: { $elemMatch: { $eq: user._id } } })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('admins', '-password')
      .populate('archivedBy', 'clerkId')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    const chatsWithLatestMessageSender = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'displayName avatarUrl email',
    });

    const chatsObj = chatsWithLatestMessageSender.map(c => c.toObject());
    
    // Add unreadCount for each chat
    for (let chat of chatsObj) {
      chat.unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: user._id },
        'seenBy.user': { $ne: user._id }
      });
    }

    res.status(200).json(chatsObj);
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
      admins: [currentUser._id], // creator is admin automatically
    });

    const fullGroupChat = await getPopulatedChat(groupChat._id);

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
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isArchived = (chat.archivedBy || []).some((id) => id && id.toString() === user._id.toString());
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter((id) => id && id.toString() !== user._id.toString());
    } else {
      chat.archivedBy.push(user._id);
    }
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setWallpaper = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { wallpaperUrl } = req.body;
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    // Remove existing wallpaper setting for this user
    chat.wallpaperBy = chat.wallpaperBy.filter(entry => entry.user.toString() !== user._id.toString());
    
    // Add new wallpaper setting if provided
    if (wallpaperUrl) {
      chat.wallpaperBy.push({ user: user._id, wallpaperUrl });
    }
    
    await chat.save();
    const updatedChat = await getPopulatedChat(chat._id);
    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.muteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const clerkId = req.headers['clerk-id'];
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const isMuted = (chat.mutedBy || []).some((id) => id && id.toString() === user._id.toString());
    if (isMuted) {
      chat.mutedBy = chat.mutedBy.filter((id) => id && id.toString() !== user._id.toString());
    } else {
      chat.mutedBy.push(user._id);
    }
    await chat.save();
    const updatedChat = await getPopulatedChat(chat._id);
    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Promote or demote a member to/from admin (toggle, WhatsApp style)
exports.toggleGroupAdmin = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ message: 'Not a group chat' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Only admins can promote/demote
    if (!isGroupAdmin(chat, currentUser)) {
      return res.status(403).json({ message: 'Only admins can change group admins' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (!chat.users.some((id) => id.equals(target._id))) {
      return res.status(400).json({ message: 'User is not a member of this group' });
    }

    // The creator can never be demoted
    if (chat.groupAdmin && chat.groupAdmin.equals(target._id)) {
      return res.status(400).json({ message: 'The group creator is always an admin' });
    }

    if ((chat.admins || []).some((id) => id.equals(target._id))) {
      chat.admins = (chat.admins || []).filter((id) => !id.equals(target._id));
    } else {
      chat.admins.push(target._id);
    }

    const fullChat = await saveAndBroadcast(req, chat);
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a member to the group
exports.addToGroup = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;
    const clerkId = req.headers['clerk-id'];

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ message: 'Not a group chat' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!isGroupAdmin(chat, currentUser)) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (chat.users.some((id) => id.equals(target._id))) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    chat.users.push(target._id);
    const fullChat = await saveAndBroadcast(req, chat);
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove a member from the group
exports.removeFromGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ message: 'Not a group chat' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!isGroupAdmin(chat, currentUser)) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    if (chat.groupAdmin && chat.groupAdmin.equals(target._id)) {
      return res.status(400).json({ message: 'The group creator cannot be removed' });
    }

    chat.users = chat.users.filter((id) => !id.equals(target._id));
    chat.admins = (chat.admins || []).filter((id) => !id.equals(target._id));

    // Delete the chat if it becomes empty
    if (chat.users.length === 0) {
      await Chat.findByIdAndDelete(chat._id);
      return res.status(200).json({ message: 'Group deleted (no members left)' });
    }

    const fullChat = await saveAndBroadcast(req, chat);
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update group name and/or profile picture (admin only)
exports.updateGroupInfo = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { chatName, chatAvatar } = req.body;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ message: 'Not a group chat' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!isGroupAdmin(chat, currentUser)) {
      return res.status(403).json({ message: 'Only admins can edit group info' });
    }

    if (chatName !== undefined) {
      const trimmed = String(chatName).trim();
      if (!trimmed) return res.status(400).json({ message: 'Group name cannot be empty' });
      chat.chatName = trimmed;
    }
    if (chatAvatar !== undefined) chat.chatAvatar = chatAvatar;

    const fullChat = await saveAndBroadcast(req, chat);
    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.togglePinMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!chat.users.some(id => id.equals(currentUser._id))) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    if (!chat.pinnedMessages) chat.pinnedMessages = [];

    const isPinned = chat.pinnedMessages.some(id => id.equals(messageId));
    if (isPinned) {
      chat.pinnedMessages = chat.pinnedMessages.filter(id => !id.equals(messageId));
    } else {
      chat.pinnedMessages.push(messageId);
    }

    await chat.save();
    
    const updatedChat = await getPopulatedChat(chat._id);

    // Broadcast updated chat
    const io = req.app.get('io');
    if (io) {
      updatedChat.users.forEach((u) => {
        io.to(u._id.toString()).emit('chat updated', updatedChat);
      });
    }

    res.status(200).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setDisappearingTimer = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { timer } = req.body;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    if (!chat.users.some(id => id.equals(currentUser._id))) {
      return res.status(403).json({ message: 'Not a member of this chat' });
    }

    chat.disappearingTimer = timer || 0;
    await chat.save();

    const fullChat = await getPopulatedChat(chat._id);
    const io = req.app.get('io');
    if (io) {
      chat.users.forEach(u => {
        io.to(u.toString()).emit('chat updated', fullChat);
      });
    }

    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const crypto = require('crypto');

exports.generateInviteLink = async (req, res) => {
  try {
    const { chatId } = req.params;
    const clerkId = req.headers['clerk-id'];

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.isGroupChat) return res.status(400).json({ message: 'Not a group chat' });

    const currentUser = await User.findOne({ clerkId });
    if (!isGroupAdmin(chat, currentUser)) {
      return res.status(403).json({ message: 'Only admins can generate invite links' });
    }

    if (!chat.inviteCode) {
      chat.inviteCode = crypto.randomBytes(8).toString('hex');
      await chat.save();
    }

    res.status(200).json({ inviteCode: chat.inviteCode });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.joinByInviteLink = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const clerkId = req.headers['clerk-id'];

    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const chat = await Chat.findOne({ inviteCode, isGroupChat: true });
    if (!chat) return res.status(404).json({ message: 'Invalid or expired invite link' });

    if (chat.users.some(id => id.equals(currentUser._id))) {
      return res.status(400).json({ message: 'You are already a member of this group' });
    }

    chat.users.push(currentUser._id);
    const fullChat = await saveAndBroadcast(req, chat);

    res.status(200).json(fullChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
