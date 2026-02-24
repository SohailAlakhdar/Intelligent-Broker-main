const express = require("express");
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve("./config/.env.dev") });
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const multer = require('multer');
const db = require(path.join(__dirname + '/db'));
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use('/uploads', express.static('uploads'));
app.use("/", require(path.join(__dirname + "/Routes/estateRoutes")));
app.use("/user", require(path.join(__dirname + "/Routes/userRoutes")));
app.use("/ai", require(path.join(__dirname + "/Routes/aiRoutes")));
app.use("/*dummy", (req, res) => {
  res.status(404).json({ message: "Not Found this URL" });
});
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port} 🚀`);
})
