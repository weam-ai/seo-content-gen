// Node.js script to create the specified user entry
const { MongoClient, ObjectId } = require('mongodb');

async function createUser() {
  const uri = 'mongodb://localhost:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('seo_content_gen');
    const usersCollection = db.collection('users');

    // Insert the user data
    const result = await usersCollection.insertOne({
      "email": "drabadiya@taskme.biz",
      "password": "$2b$10$XA0TdAc4wUS1VC3hmPDehutWpBAIWxwSyf06sdokUJqg6fy.K3C1O",
      "roleId": new ObjectId("66e01d4145567d34d663bdae"),
      "roleCode": "SUPER_ADMIN",
      "mobNo": "9874561230",
      "fcmTokens": [],
      "themeMode": 1,
      "fileSize": 1073741824,
      "usedSize": 0,
      "mfa": false,
      "isActive": true,
      "isProfile": false,
      "createdAt": new Date("2024-09-10T10:20:41.181Z"),
      "updatedAt": new Date("2025-08-30T18:30:00.043Z"),
      "__v": 0,
      "isPrivateBrainVisible": false,
      "mcpdata": {
        "GOOGLE_FORMS": {
          "access_token": "N5bDphzU3H2xUz0SRvM0EanJ1Mx+IIvSSrfwTALD51dZXHi1LyCSo/KVBfsbOFCX1cqajONbvyZX6nAEhSeoOREVJ/EFCU6p40UUlrugttd8ebyvjXFDQvnneQRCO1mFpSLjSujSM6XjZEl4N018SrxGpfOO3lzlvtN+igHEhMxlcJs5DVnQxDb1ZsYSGFFavMRjNcad6GhNt7gb2esENCJBA5Pw3b8vHxadUGUlJBMyKL0YomJZ88yBbg698TpjtoFWew8rfxGclu3SGoZgd6vPEXv/XBgPLiGJeElOOwg=",
          "expiry": "2025-08-11T12:29:37.861810"
        }
      }
    });

    console.log('User created successfully!', result.insertedId);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await client.close();
  }
}

createUser();