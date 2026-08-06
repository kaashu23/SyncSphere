const User = require('../models/User');

exports.onboardUser = async (req, res) => {
  const { clerkId, username, avatarUrl, email, displayName } = req.body;

  if (!clerkId || !username) {
    return res.status(400).json({ message: 'clerkId and username are required' });
  }

  try {
    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername && existingUsername.clerkId !== clerkId) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Use upsert to create the user if the webhook didn't fire (common on localhost)
    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { 
        username, 
        avatarUrl,
        email: email || `${clerkId}@placeholder.com`, // Fallback if missing
        displayName: displayName || username
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error in onboardUser:', error);
    res.status(500).json({ message: 'Server error during onboarding' });
  }
};

exports.getMe = async (req, res) => {
  const clerkId = req.headers['clerk-id'];
  if (!clerkId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchUsers = async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { username: { $regex: req.query.search, $options: 'i' } },
          { displayName: { $regex: req.query.search, $options: 'i' } },
          { email: { $regex: req.query.search, $options: 'i' } },
        ],
      }
    : {};

  const clerkId = req.headers['clerk-id'];
  const currentUser = await User.findOne({ clerkId });

  const users = await User.find(keyword).find({ _id: { $ne: currentUser?._id } });
  res.send(users);
};

exports.sendRequest = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const targetUserId = req.params.id;
    
    const sender = await User.findOne({ clerkId });
    const target = await User.findById(targetUserId);
    
    if (!sender || !target) return res.status(404).json({ message: 'User not found' });
    if (sender.friends.some(id => id.toString() === targetUserId)) return res.status(400).json({ message: 'Already friends' });
    if (target.friendRequests.some(id => id.toString() === sender._id.toString())) return res.status(400).json({ message: 'Request already sent' });
    
    target.friendRequests.push(sender._id);
    sender.sentRequests.push(target._id);
    
    await target.save();
    await sender.save();
    
    res.status(200).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const senderUserId = req.params.id;
    
    const currentUser = await User.findOne({ clerkId });
    const sender = await User.findById(senderUserId);
    
    if (!currentUser || !sender) return res.status(404).json({ message: 'User not found' });
    
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== senderUserId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== currentUser._id.toString());
    
    if (!currentUser.friends.includes(senderUserId)) currentUser.friends.push(senderUserId);
    if (!sender.friends.includes(currentUser._id)) sender.friends.push(currentUser._id);
    
    await currentUser.save();
    await sender.save();
    
    res.status(200).json({ message: 'Request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const senderUserId = req.params.id;
    
    const currentUser = await User.findOne({ clerkId });
    const sender = await User.findById(senderUserId);
    
    if (!currentUser || !sender) return res.status(404).json({ message: 'User not found' });
    
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id.toString() !== senderUserId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== currentUser._id.toString());
    
    await currentUser.save();
    await sender.save();
    
    res.status(200).json({ message: 'Request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId })
      .populate('friends', 'displayName avatarUrl email username status')
      .populate('friendRequests', 'displayName avatarUrl email username status')
      .populate('sentRequests', 'displayName avatarUrl email username status');
      
    if (!currentUser) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json({
      friends: currentUser.friends,
      friendRequests: currentUser.friendRequests,
      sentRequests: currentUser.sentRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

