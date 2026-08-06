const mongoose = require('mongoose');
const User = require('./models/User');

const uri = "mongodb+srv://kashish:kashish@imagegallery.gpnrfyi.mongodb.net/syncsphere?retryWrites=true&w=majority";

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB');
  const users = await User.find({$or: [{username: {$regex: 'RT8', $options: 'i'}}, {displayName: {$regex: 'RT8', $options: 'i'}}]});
  console.log('Users in DB:', users.map(u => ({ username: u.username, displayName: u.displayName, email: u.email })));
  process.exit(0);
}).catch(console.error);
