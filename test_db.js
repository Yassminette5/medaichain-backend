const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/medaichain', { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection;
  const col = db.collection('appointments');
  const appts = await col.find({}).toArray();
  console.log('Total appointments:', appts.length);
  if (appts.length > 0) {
    console.log('Latest appointment:', appts[appts.length - 1]);
  }
  process.exit(0);
}
test().catch(console.dir);
