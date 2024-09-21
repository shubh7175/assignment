const express = require('express');
const mongoose = require('mongoose');
const router = require('./Routes/UserRoutes');
const router1 = require('./Routes/AdminRoutes');

const app = express();
require('dotenv').config();
const port = process.env.PORT || 400;
const url = process.env.MONGO_URI;
app.use(express.json());
const server = app.listen(port, () => {
  console.log(`server is ruuning on ${port}`);
});

async function connectDatabase() {
  try {
    await mongoose.connect(url);
    console.log('mongodb connected');
  } catch (err) {
    console.error('could not connected', err);
    process.exit(1);
  }
}
app.use('/v1', router);
app.use('/v2', router1);
connectDatabase();
