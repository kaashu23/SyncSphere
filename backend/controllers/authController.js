const { Webhook } = require('svix');
const User = require('../models/User');

exports.clerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('You need a CLERK_WEBHOOK_SECRET in your .env');
  }

  // Get the headers and body
  const headers = req.headers;
  const payload = req.body; // Needs raw body if not parsed, but we assume express.raw or bodyParser is handled on this specific route

  // Get the Svix headers for verification
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occured -- no svix headers' });
  }

  // Create a new Webhook instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    // Verify payload and headers
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err.message);
    return res.status(400).json({ error: 'Error occured' });
  }

  const { id } = evt.data;
  const eventType = evt.type;
  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  if (eventType === 'user.created') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    
    try {
      await User.create({
        clerkId: id,
        email: email,
        displayName: `${first_name || ''} ${last_name || ''}`.trim(),
        avatarUrl: image_url,
      });
      console.log('User synced to database successfully');
    } catch (err) {
      console.error('Error syncing user to database', err);
    }
  }

  if (eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        {
          email: email,
          displayName: `${first_name || ''} ${last_name || ''}`.trim(),
          avatarUrl: image_url,
        }
      );
      console.log('User updated in database successfully');
    } catch (err) {
      console.error('Error updating user in database', err);
    }
  }

  if (eventType === 'user.deleted') {
    try {
      await User.findOneAndDelete({ clerkId: id });
      console.log('User deleted from database successfully');
    } catch (err) {
      console.error('Error deleting user from database', err);
    }
  }

  res.status(200).json({ success: true, message: 'Webhook received' });
};

const ImageKit = require('imagekit');
exports.imagekitAuth = (req, res) => {
  try {
    const imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
    const authenticationParameters = imagekit.getAuthenticationParameters();
    res.json(authenticationParameters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
