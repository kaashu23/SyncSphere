const Message = require('../models/Message');
const User = require('../models/User');
const Chat = require('../models/Chat');

exports.sendMessage = async (req, res) => {
  const { content, chatId, type, replyTo, forwardedFrom } = req.body;
  const clerkId = req.headers['clerk-id'];

  if (!content || !chatId) {
    console.log('Invalid data passed into request');
    return res.sendStatus(400);
  }

  try {
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const chat = await Chat.findById(chatId).populate('users');
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    if (!chat.isGroupChat) {
      const otherUser = chat.users.find(u => u._id.toString() !== currentUser._id.toString());
      if (otherUser) {
        if (currentUser.blockedUsers.includes(otherUser._id)) {
          return res.status(403).json({ message: 'You have blocked this user' });
        }
        if (otherUser.blockedUsers && otherUser.blockedUsers.includes(currentUser._id)) {
          return res.status(403).json({ message: 'You have been blocked by this user' });
        }
      }
    }

    var newMessage = {
      sender: currentUser._id,
      content: content,
      chat: chatId,
      type: type || 'text'
    };

    if (replyTo) {
      newMessage.replyTo = replyTo;
    }

    if (forwardedFrom) {
      newMessage.forwardedFrom = forwardedFrom;
    }

    if (chat.disappearingTimer && chat.disappearingTimer > 0) {
      newMessage.expiresAt = new Date(Date.now() + chat.disappearingTimer * 3600 * 1000);
    }

    if (type !== 'image' && type !== 'video' && type !== 'audio' && type !== 'gif' && type !== 'sticker') {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = content.match(urlRegex);
      if (urls && urls.length > 0) {
        try {
          const { getLinkPreview } = require('link-preview-js');
          const previewData = await getLinkPreview(urls[0], { timeout: 2000 });
          if (previewData && previewData.title) {
            newMessage.linkPreview = {
              url: previewData.url,
              title: previewData.title,
              description: previewData.description,
              image: previewData.images && previewData.images.length > 0 ? previewData.images[0] : null
            };
          }
        } catch (err) {
          console.error('Link preview error:', err.message);
        }
      }
    }

    var message = await Message.create(newMessage);

    message = await message.populate('sender', 'displayName avatarUrl clerkId');
    message = await message.populate('chat');
    if (replyTo) {
      message = await message.populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'displayName avatarUrl' } });
    }
    
    message = await User.populate(message, {
      path: 'chat.users',
      select: 'displayName avatarUrl email clerkId',
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.allMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'displayName avatarUrl email clerkId')
      .populate('chat')
      .populate({ path: 'replyTo', select: 'content sender type', populate: { path: 'sender', select: 'displayName avatarUrl' } });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.body;
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).send('User not found');

    // Update all messages in this chat where currentUser is not the sender and not in seenBy
    await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: currentUser._id },
        'seenBy.user': { $ne: currentUser._id } 
      },
      { 
        $push: { seenBy: { user: currentUser._id, at: Date.now() } } 
      }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).send('User not found');

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);
    res.status(200).json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const clerkId = req.headers['clerk-id'];
    
    if (!clerkId) return res.status(401).json({ message: 'Missing clerk-id' });
    
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.reactions) {
      message.reactions = [];
    }

    // Check if user already reacted with THIS emoji
    const existingReactionIndex = message.reactions.findIndex(
      r => r.user && r.user.toString() === currentUser._id.toString() && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction if already exists (toggle)
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ user: currentUser._id, emoji });
    }

    await message.save();
    
    // We populate sender to return the full message for updating state easily
    const updatedMessage = await Message.findById(messageId).populate('sender', 'firstName lastName displayName email avatarUrl clerkId');

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).send('User not found');

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (message.sender.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.editedAt = Date.now();
    await message.save();

    const updatedMessage = await Message.findById(messageId).populate('sender', 'firstName lastName displayName email avatarUrl clerkId');
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.starMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).send('User not found');

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.starredBy) message.starredBy = [];

    const index = message.starredBy.indexOf(currentUser._id);
    if (index > -1) {
      message.starredBy.splice(index, 1);
    } else {
      message.starredBy.push(currentUser._id);
    }

    await message.save();
    
    const updatedMessage = await Message.findById(messageId).populate('sender', 'firstName lastName displayName email avatarUrl clerkId');
    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
