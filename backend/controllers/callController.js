const Call = require('../models/Call');
const User = require('../models/User');
const Chat = require('../models/Chat');

exports.createCallLog = async (req, res) => {
  try {
    const { type, isGroup, chat, participants, status, startedAt, endedAt, durationSeconds } = req.body;
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    const newCall = new Call({
      type,
      isGroup,
      chat,
      caller: currentUser._id,
      participants,
      status,
      startedAt,
      endedAt,
      durationSeconds,
    });

    const savedCall = await newCall.save();
    
    // Populate for response
    const populatedCall = await Call.findById(savedCall._id)
      .populate('caller', 'displayName avatarUrl')
      .populate('participants', 'displayName avatarUrl')
      .populate('chat', 'chatName isGroupChat chatAvatar');

    res.status(201).json(populatedCall);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCallLogs = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    // Fetch calls where the user is either the caller or in the participants list
    const calls = await Call.find({
      $or: [
        { caller: currentUser._id },
        { participants: currentUser._id }
      ]
    })
      .populate('caller', 'displayName avatarUrl clerkId')
      .populate('participants', 'displayName avatarUrl clerkId')
      .populate('chat', 'chatName isGroupChat chatAvatar')
      .sort({ createdAt: -1 })
      .limit(50); // limit for now

    res.status(200).json(calls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
