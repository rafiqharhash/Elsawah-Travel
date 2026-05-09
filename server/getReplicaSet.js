const mongoose = require('mongoose');

const uri = "mongodb://rafiqharhash_db_user:myclusterpassword@ac-yecreeq-shard-00-00.asqlj5y.mongodb.net:27017/uniride?ssl=true&authSource=admin&directConnection=true";

mongoose.connect(uri)
  .then(() => {
    console.log('Connected to MongoDB');
    return mongoose.connection.db.admin().command({ isMaster: 1 });
  })
  .then((result) => {
    console.log("Replica Set Name:", result.setName);
    console.log("Primary Node:", result.primary);
    console.log("All Hosts:", result.hosts);
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
