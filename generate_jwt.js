const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

async function generateToken() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('seo_content_gen');
  const user = await db.collection('users').findOne({});
  
  if (!user) {
    console.log('No user found');
    return;
  }
  
  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    'razorcopy',
    { expiresIn: '24h' }
  );
  
  console.log('JWT Token:', token);
  console.log('User ID:', user._id);
  console.log('Email:', user.email);
  
  await client.close();
}

generateToken().catch(console.error);