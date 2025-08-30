// Node.js script to generate JWT token for the created user
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

async function generateJWT() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('seo_content_gen');
    const usersCollection = db.collection('users');

    // Get the user from database
    const user = await usersCollection.findOne({ email: 'drabadiya@taskme.biz' });
    
    if (!user) {
      console.error('User not found!');
      return;
    }

    // Generate JWT token
    const payload = {
      sub: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      roleCode: user.roleCode
    };

    const secret = process.env.JWT_SECRET || 'secretKey';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    console.log('\n=== JWT Token Generated ===');
    console.log('User ID:', user._id.toString());
    console.log('Email:', user.email);
    console.log('JWT Token:', token);
    console.log('\n=== Use this token in frontend ===');
    console.log(`Bearer ${token}`);
    
  } catch (error) {
    console.error('Error generating JWT:', error);
  } finally {
    await client.close();
  }
}

generateJWT();