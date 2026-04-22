const mongoose = require('mongoose');
const category = require('./Model/categoryModel');
const type = require('./Model/estateTypeModel');
const user = require('./Model/userModel');
const estate = require('./Model/estateModel');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve("./config/.env.dev") });
main().catch(err => console.log(err));

async function main() {
    try {
        mongoose.set("strictQuery", false)
        await mongoose.connect(process.env.DB_URI || "", {
            serverSelectionTimeoutMS: 30000,
        });
        console.log("Database connected 👌");
    } catch (error) {
        console.error("Database connection failed ❌", error);
    }
    //   await mongoose.connect('mongodb+srv://wamb:wamb123@homeexplorerdb.ykmn0.mongodb.net/HomExplorer'); // Atlas DB Server
}



initDb();
function initDb() {
    // const estate = require('./Model/estateModel');

    // const newEstate = new estate.estateModel({
    //     sellerId: "69c3660f6c2eaa73b0ea8545",
    //     address: "Apartment 12, Fifth Settlement, New Cairo",
    //     price: 3200000,
    //     numOfRooms: 3,
    //     numOfBathRooms: 2,
    //     floor: 4,
    //     size: 180,
    //     desc: "Modern apartment in a quiet residential compound",
    //     status: "approve",
    //     rate: 4.5,
    //     type: "69a0640cd2c41a0bce34c3c2",
    //     category: "69a0640cd2c41a0bce34c3c0",
    //     addressOnMap: [30.0131, 31.4913],
    //     auctionData: {
    //         duration: 5,
    //         endDate: new Date("2028-06-01")
    //     },
    //     pic: [
    //         {
    //             path: "https://res.cloudinary.com/sample.jpg",
    //             name: "homeExplorerImages/sample"
    //         }
    //     ],
    //     contract: {
    //         path: "https://res.cloudinary.com/contract.jpg",
    //         name: "homeExplorerImages/contract"
    //     }
    // });

    // newEstate.save(function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log("estate inserted");
    // });


    // -------------
    // const apartment = new category.categoryModel({ name: 'Apartment' });
    // const villa = new category.categoryModel({ name: 'Villa' });

    // category.categoryModel.insertMany([apartment, villa]).then(function () {
    //     console.log("category inserted")  // Success
    // }).catch(function (error) {
    //     console.log(error)      // Failure
    // });

    // const auction = new type.estateTypeModel({ name: 'Auction' });
    // const sell = new type.estateTypeModel({ name: 'Sell' });
    // const rent = new type.estateTypeModel({ name: 'Rent' });

    // type.estateTypeModel.insertMany([auction, sell, rent]).then(function () {
    //     console.log("type inserted")  // Success
    // }).catch(function (error) {
    //     console.log(error)      // Failure
    // });
    // const newUser = new user.userModel({
    //     name: "AdminUser",
    //     password: "Admin@user123",
    //     email: "Admin@user.com",
    //     phoneNumber: "00121414252",
    //     admin: "false"
    // });

    // newUser.save(function (err) {
    //     if (err) {
    //         console.log(err);
    //     }
    //     console.log("user inserted")
    // });
}
