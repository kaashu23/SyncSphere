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

