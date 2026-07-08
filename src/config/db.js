import mongoose from 'mongoose';

function connectToDB() {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('server is connected to DB');
    })
    .catch(() => {
      console.log('Error connecting to DB');
      process.exit(1);
    });
}

export default connectToDB;
