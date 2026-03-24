const mongoose = require('mongoose');

const uri = `mongodb://rathodmilan216_db_user:hge1GFQXgMXtlIQ6@cluster0-shard-00-00.7ahqov8.mongodb.net:27017,cluster0-shard-00-01.7ahqov8.mongodb.net:27017,cluster0-shard-00-02.7ahqov8.mongodb.net:27017/digital-circular?ssl=true&authSource=admin&retryWrites=true&w=majority`;

mongoose.connect(uri)
  .then(() => {
    console.log('SUCCESS');
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
  });
