const Status = require('../models/Status');
const User = require('../models/User');

exports.getStatuses = async (req, res) => {
  try {
    const clerkId = req.headers['clerk-id'];
    const currentUser = await User.findOne({ clerkId });
    if (!currentUser) return res.status(401).json({ message: 'Unauthorized' });

    const friendIds = currentUser.friends.map(id => id.toString());

    // Only show the current user's own statuses and statuses from friends
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() },
      $or: [
        { user: currentUser._id },
        { user: { $in: friendIds } },
      ],
    })
      .populate('user', 'displayName avatarUrl clerkId')
      .sort({ createdAt: -1 });

    // Group by user
    const grouped = statuses.reduce((acc, status) => {
      const userId = status.user._id.toString();
      if (!acc[userId]) acc[userId] = { user: status.user, statuses: [] };
      acc[userId].statuses.push(status);
      return acc;
    }, {});

    res.status(200).json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStatus = async (req, res) => {
  const { content, mediaType, caption } = req.body;
  const clerkId = req.headers['clerk-id'];

  try {
    const user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const status = await Status.create({
      user: user._id,
      content,
      mediaType: mediaType || 'image',
      caption,
      expiresAt
    });

    const fullStatus = await Status.findById(status._id).populate('user', 'displayName avatarUrl clerkId');
    res.status(201).json(fullStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
