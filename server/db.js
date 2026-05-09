const mongoose = require("mongoose");
const category = require("./Model/categoryModel");
const type = require("./Model/estateTypeModel");
const user = require("./Model/userModel");
const estate = require("./Model/estateModel");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve("./config/.env.dev") });
main().catch((err) => console.log(err));

async function main() {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.DB_URI || "", {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("Database connected 👌");
  } catch (error) {
    console.error("Database connection failed ❌", error);
  }
  //   await mongoose.connect('mongodb+srv://wamb:wamb123@homeexplorerdb.ykmn0.mongodb.net/HomExplorer'); // Atlas DB Server
}

initDb()
async function initDb() {
  const categoryCount = await category.categoryModel.countDocuments();
  const typeCount = await type.estateTypeModel.countDocuments();
  const userCount = await user.userModel.countDocuments();

  if (categoryCount === 0) {
    await category.categoryModel.insertMany([
      { name: 'Apartment' },
      { name: 'Villa' }
    ]);
    console.log("categories inserted");
  }

  if (typeCount === 0) {
    await type.estateTypeModel.insertMany([
      { name: 'Auction' },
      { name: 'Sell' },
      { name: 'Rent' }
    ]);
    console.log("types inserted");
  }

  if (userCount === 0) {
    await user.userModel.create({
      name: "AdminUser",
      password: "Admin@user123",
      email: "Admin@user.com",
      phoneNumber: "00121414252",
      admin: false
    });
    console.log("user inserted");
  }
}
// await estateModel.insertMany([]);