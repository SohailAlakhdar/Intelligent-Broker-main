const express = require("express");
const user = require("../Model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();

exports.addUser = async function (req, res) {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    req.body.email = req.body.email.toLowerCase();

    const checkEmail = await user.userModel.findOne({ email: req.body.email });
    if (checkEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }
    console.log({ Req: req.body });

    req.body.password = await bcrypt.hash(req.body.password, 10);
    const newUser = new user.userModel({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
    });
    console.log({ newUser });
    const savedUser = await newUser.save();
    createToken(savedUser, res);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

exports.login = async function (req, res) {
  try {
    // ✅ Validate input
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    req.body.email = req.body.email.toLowerCase();

    const findUser = await user.userModel.findOne({ email: req.body.email });
    if (!findUser) {
      return res.status(401).json({ message: "Invalid Username or Password" });
    }

    const isCorrect = await bcrypt.compare(req.body.password, findUser.password);
    if (isCorrect) {
      createToken(findUser, res);
    } else {
      return res.status(401).json({ message: "Invalid Username or Password" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

function createToken(user, res) {
  const payload = {
    id: user._id,
    userName: user.userName,
    email: user.email,
    admin: user.admin,
  };

  const token = jwt.sign(
    payload,
    process.env.ACCESS_USER_TOKEN_SIGNATURE,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    message: "Success",
    userId: user._id,
    token: "Bearer " + token,
  });
}

exports.verifyJWT = function (req, res, next) {
  const authHeader = req.headers["x-access-token"];

  if (!authHeader) {
    return res.status(401).json({ isLoggedIn: false, message: "No token provided" });
  }

  const token = authHeader.split(' ')[1];

  // ✅ handle missing token after split
  if (!token) {
    return res.status(401).json({ isLoggedIn: false, message: "Incorrect Token Given" });
  }

  jwt.verify(token, process.env.ACCESS_USER_TOKEN_SIGNATURE, (err, decoded) => {
    if (err) {
      return res.status(401).json({ isLoggedIn: false, message: "Failed To Authenticate" }); // ✅ 401
    }
    req.user = decoded;
    next();
  });
};

exports.serverAdminCheck = async function (req, res, next) {
  try {
    const adminCheck = await user.userModel.findOne({ _id: req.user.id, admin: true });
    if (adminCheck) {
      next();
    } else {
      return res.status(403).json({ message: "Admin privilege needed" }); // ✅ 403 not 400
    }
  } catch (error) {
    return res.status(500).json({ error: error.message }); // ✅ try/catch added
  }
};

exports.checkAdmin = function (req, res) {
  user.userModel.findOne({ _id: req.user.id, admin: true })
    .then(foundUser => res.status(200).json({ isAdmin: !!foundUser }))
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.getAllUsers = function (req, res) {
  user.userModel.find()
    .then(result => res.status(200).json(result))
    .catch(err => res.status(500).json({ error: err.message }));
};

exports.ChangeRole = function (req, res) {
  // ✅ Validate input
  if (!req.body.userId || req.body.roleValue === undefined) {
    return res.status(400).json({ message: "userId and roleValue are required" });
  }
  user.userModel.findOneAndUpdate(
    { _id: req.body.userId },
    { admin: req.body.roleValue },
    { new: true }
  )
    .then(() => res.status(200).json({ message: "Role updated successfully" }))
    .catch(err => res.status(500).json({ error: err.message }));
};
