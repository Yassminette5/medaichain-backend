const { MongoClient } = require('mongodb');
async function check() {
  const uri = 'mongodb://127.0.0.1:27017/medaichain'; // fallback
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('medaichain');
  const user = await db.collection('users').findOne({ email: 'pharmacy@test.com' });
  console.log('User wallet:', user.walletAddress);
  await client.close();
}
check().catch(console.error);
