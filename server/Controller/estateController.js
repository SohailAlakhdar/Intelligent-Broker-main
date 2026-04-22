const express = require("express");
const category = require("../Model/categoryModel");
const type = require("../Model/estateTypeModel");
const estate = require("../Model/estateModel");
const rate = require("../Model/rateModel");
const save = require("../Model/savedModel");
const visit = require("../Model/visitModel");
const bid = require("../Model/bidEstateModel");
const user = require("../Model/userModel");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;
// const objectId = require('mongodb').ObjectID;
const emailNotification = require("./notification");
const { Types } = require("mongoose");

function picAddOperation(files, estate) {
  if (!files) return;

  if (files.contract) {
    estate.contract = {};
    estate.contract.path = files.contract[0].path;
    estate.contract.name = files.contract[0].filename;
  }
  if (files.pic) {
    files.pic.forEach((file) => {
      estate.pic.push({
        path: file.path,
        name: file.filename,
      });
    });
  }
}
async function picDeleteOperation(picsToDelete) {
  try {
    if (!picsToDelete || !picsToDelete.length) return;
    const deletePromises = picsToDelete.map((name) =>
      cloudinary.uploader.destroy(name),
    );
    await Promise.all(deletePromises);
    console.log("All pictures deleted successfully");
  } catch (err) {
    console.error("Error deleting pictures:", err);
    throw err;
  }
}

exports.getAllEstates = async function (req, res) {
  try {
    const partition = parseInt(req.params.partition) || 0;
    const skipCount = partition * 60;

    const estates = await estate.estateModel
      .find({ status: "approve" })
      .skip(skipCount)
      .limit(60)
      .populate("category")
      .populate("type");
    res.status(200).json(estates);
  } catch (err) {
    console.error("getAllEstates error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEstate = async function (req, res) {
  try {
    if (!req.body._id) {
      return res.status(400).json({ error: "Estate ID is required" });
    }
    const deletedEstate = await estate.estateModel.findByIdAndDelete(
      req.body._id,
    );
    if (!deletedEstate) {
      return res.status(404).json({ error: "Estate not found" });
    }
    // delete images
    picDeleteOperation([deletedEstate.contract, ...deletedEstate.pic]);
    await Promise.all([
      save.savedModel.deleteMany({ estateId: req.body._id }),
      rate.rateModel.deleteMany({ estateId: req.body._id }),
      visit.visitModel.deleteMany({ estateId: req.body._id }),
      bid.bidModel.deleteMany({ estateId: req.body._id }),
    ]);
    return res.status(200).json({ message: "Done" });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};
exports.findEstate = function (req, res) {
  estate.estateModel
    .findById({ _id: req.params.estateId })
    .populate("category")
    .populate("type")
    .populate("sellerId", "name email") // optional (good practice)
    .exec(function (error, doc) {
      if (error) {
        return res.status(400).send(JSON.stringify(error));
      }

      if (!doc) {
        return res.status(404).send(JSON.stringify("Estate not found"));
      }

      res.status(200).send(doc);
    });
};

exports.addEstate = async function (req, res) {
  let newEstate;
  try {
    // add estate to DB
    newEstate = new estate.estateModel({
      ...req.body,
      sellerId: req.user.id,
    });
    picAddOperation(req.files, newEstate);
    await newEstate.save();
    res.status(200).json({ message: "Done", estate: newEstate });
  } catch (error) {
    console.error("addEstate error:", error);
    if (newEstate) {
      await picDeleteOperation([newEstate?.contract, ...(newEstate.pic || [])]);
    }
    res.status(400).json({ error: error.message });
  }
};

exports.updateEstateImage = async function (req, res) {
  try {
    console.log({ body: req.body });

    if (req.file_error) {
      return res.status(400).json(req.file_error);
    }
    console.log("UpdateImage");

    const estateDoc = await estate.estateModel
      .findById(req.body.estateId)
      .select("pic contract");
    console.log({ estateDoc });
    if (!estateDoc) {
      return res.status(404).json({ message: "Estate not found" });
    }
    let deletedPics = [];
    // PICTURES HANDLING
    console.log("PICTURES");
    if (req.body.deletedPicNames) {
      deletedPics = req.body.deletedPicNames.split(",");
      estateDoc.pic = estateDoc.pic.filter(
        (pic) => !deletedPics.includes(pic.name),
      );
    }
    // CONTRACT HANDLING ----------------------
    console.log("CONTRACT");
    if (req.files?.contract) {
      if (estateDoc.contract) {
        await picDeleteOperation([estateDoc.contract?.name]);
      }
    }
    // Delete removed pictures from cloudinary
    if (deletedPics.length > 0) {
      console.log({ deletedPics });
      await picDeleteOperation(deletedPics);
    }

    // Add new pictures and contract to estate
    picAddOperation(req.files, estateDoc);
    await estateDoc.save();

    res.status(200).json({
      message: "Done",
      data: estateDoc,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateEstate = async function (req, res) {
  try {
    const updatedEstate = await estate.estateModel.findByIdAndUpdate(
      req.body.estateId,
      { ...req.body, status: "pending" },
      { new: true },
    );
    if (!updatedEstate) {
      return res.status(404).json({ message: "Estate not found" });
    }
    res.status(200).json({ message: "Done", estate: updatedEstate });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.approveEstate = function (req, res) {
  estate.estateModel
    .findOneAndUpdate(
      { _id: req.body._id },
      { status: req.body.status },
      { new: true },
    )
    .populate("sellerId", "email")
    .then((data) => {
      emailNotification.estateNotification(data);
      res.status(200).send(JSON.stringify("Ok"));
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send(JSON.stringify(err));
    });
};

exports.getCategoryAndType = async function (req, res) {
  var categoryAndType = {};
  try {
    categoryAndType.category = await category.categoryModel.find({}).exec();
    categoryAndType.type = await type.estateTypeModel.find({}).exec();
    res.send(categoryAndType);
  } catch (error) {
    console.log(error);
  }
};

exports.getApproveEstateRequests = function (req, res) {
  estate.estateModel
    .find({
      status: "pending",
    })
    .populate("category")
    .populate("type")
    .exec(function (error, aproveReq) {
      if (error) {
        return res.status(400).send(JSON.stringify(error));
      }
      res.send(aproveReq);
    });
};

exports.getMyEstates = async function (req, res) {
  try {
    const myEstates = await estate.estateModel
      .find({ sellerId: req.user.id })
      .populate("category")
      .populate("type");

    res.status(200).json(myEstates);
  } catch (error) {
    console.error("getMyEstates error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*----------------------------Sprint 2----------------------------*/

async function estateOverAllRate(estateId) {
  var scoreTotal = 0,
    responseTotal = 0,
    overallRating = 0;
  try {
    let rates = await rate.rateModel
      .aggregate()
      .match({ estateId: Types.ObjectId(estateId) })
      .group({ _id: "$rate", count: { $sum: 1 } });
    rates.forEach((element) => {
      scoreTotal += element.count * element._id;
      responseTotal += element.count;
    });
    overallRating = scoreTotal / responseTotal;

    let modifiedEstate = await estate.estateModel.findOneAndUpdate(
      { _id: estateId },
      { rate: overallRating.toFixed(2) },
    );

    return { rate: modifiedEstate.rate };
  } catch (error) {
    console.log(error);
    return error;
  }
}

exports.addAndUpdateRate = async function (req, res) {
  const filter = {
    userId: req.user.id,
    estateId: req.body.estateId,
  };
  const update = {
    rate: req.body.rate,
  };
  try {
    await rate.rateModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    await estateOverAllRate(req.body.estateId);
    res.send(JSON.stringify("ok"));
  } catch (error) {
    console.log(error);
    res.send(JSON.stringify(error));
  }
};

exports.getRates = async function (req, res) {
  try {
    const result = await rate.rateModel.find(
      { userId: req.user.id },
      { _id: 0, __v: 0, userId: 0 }, // projection to exclude these fields
    );
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.saveAndUnsave = async function (req, res) {
  try {
    const filter = {
      userId: req.user.id,
      estateId: req.body.estateId,
    };
    const existing = await save.savedModel.findOne(filter);
    if (!existing) {
      // Save the estate
      const newSave = new save.savedModel(filter);
      await newSave.save();
      return res.status(200).json({ message: "Saved successfully" });
    } else {
      // Unsave the estate
      await save.savedModel.findOneAndDelete(filter);
      return res.status(200).json({ message: "Unsaved successfully" });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

exports.getSavedEstates = async function (req, res) {
  try {
    const savedEstates = await save.savedModel
      .find({ userId: req.user.id }, { _id: 0, __v: 0, userId: 0 })
      .populate({
        path: "estateId",
        populate: [
          { path: "type", select: "name -_id" },
          { path: "category", select: "name -_id" },
        ],
      });
    res.status(200).json(savedEstates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.search = async function (req, res) {
  try {
    let filter = { status: "approve", ...req.body };

    // Text search
    if (req.body.text) {
      filter.$text = { $search: req.body.text };
      delete filter.text;
    }

    // Price range filter
    if (
      req.body.price &&
      Array.isArray(req.body.price) &&
      req.body.price.length === 2
    ) {
      filter.price = {
        $gt: req.body.price[0] - 1,
        $lt: req.body.price[1] + 1,
      };
    }

    // Size range filter
    if (
      req.body.size &&
      Array.isArray(req.body.size) &&
      req.body.size.length === 2
    ) {
      filter.size = {
        $gt: req.body.size[0] - 1,
        $lt: req.body.size[1] + 1,
      };
    }

    const estates = await estate.estateModel
      .find(filter)
      .populate({ path: "category", select: "name -_id" })
      .populate({ path: "type", select: "name -_id" });

    res.status(200).json(estates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/*---------------------------- Sprint 3 ----------------------*/

exports.scheduleAndUpdateVisit = async function (req, res) {
  try {
    if (!req.body.estateId || !req.body.date) {
      return res
        .status(400)
        .json({ message: "estateId and date are required" });
    }
    const visitDoc = await visit.visitModel.findOneAndUpdate(
      { estateId: req.body.estateId, visitorId: req.user.id },
      {
        date: req.body.date,
        status: req.body.status || "pending",
      },
      {
        upsert: true, // create new if not exist
        new: true, // return the updated document
        setDefaultsOnInsert: true,
      },
    );
    // Send email notification
    emailNotification
      .scheduleVisitNotificataion(visitDoc._id)
      .catch((err) => console.log(err));
    res.status(200).json({ message: "Done", visit: visitDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.approveScheduleVisit = async function (req, res) {
  try {
    const allowedStatus = ["approve", "rejecte"];

    if (!allowedStatus.includes(req.body.status)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    const visitDoc = await visit.visitModel
      .findById(req.body.visitId)
      .populate({
        path: "estateId",
        select: "sellerId",
      });

    if (!visitDoc) {
      return res.status(404).json({
        error: "Visit not found",
      });
    }

    // Authorization check
    if (!visitDoc.estateId.sellerId.equals(req.user.id)) {
      return res.status(403).json({
        error: "Not authorized",
      });
    }
    visitDoc.status = req.body.status;
    await visitDoc.save();

    emailNotification
      .scheduleVisitReplyNotification(visitDoc._id)
      .catch(console.error);

    res.status(200).json({
      message: "Done",
      visit: visitDoc,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getVisitsDates = async function (req, res) {
  try {
    const estateId = req.params.estateId;

    if (!estateId) {
      return res.status(400).json({ message: "estateId is required" });
    }
    if (!Types.ObjectId.isValid(estateId)) {
      return res.status(400).json({ message: "Invalid estateId format" });
    }
    const visits = await visit.visitModel
      .find({ estateId })
      .populate("estateId")
      .populate("visitorId", "name email phoneNumber");

    return res.status(200).json(visits);
  } catch (err) {
    console.error("getVisitsDates error:", err);
    return res.status(500).json({ error: err.message });
  }
};
/*---------------------------- Sprint 4 ----------------------*/

exports.placeBid = async function (req, res) {
  try {
    //  Prevent lower bids
    const estateData = await estate.estateModel.findById(req.body.estateId);
    if (req.body.price <= estateData.price) {
      return res.status(400).json({
        error: "Bid must be higher than current price",
      });
    }

    // Check if auction ended or if user is auction owner
    const auctionEndStatus = await auctionEnd(req.body.estateId);
    if (
      auctionEndStatus.status ||
      auctionEndStatus.auctionOwner === req.user.id
    ) {
      return res
        .status(400)
        .json({ error: "Cannot place bid on an ended auction" });
    }

    // Create new bid
    const newBid = new bid.bidModel({
      estateId: req.body.estateId,
      price: req.body.price,
      userId: req.user.id,
    });

    await newBid.save();
    // Update estate price
    await estate.estateModel.updateOne(
      { _id: req.body.estateId },
      { price: req.body.price },
    );
    console.log({ user: req.user });

    // Send notification
    await emailNotification.placeBidNotification(
      req.body.estateId,
      req.user.email,
    );
    res.status(200).json({ message: "Done", bid: newBid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.approveAuction = async function (req, res) {
  try {
    const estateId = req.body.estateId;

    const estateData = await estate.estateModel.findById(estateId);

    if (!estateData) {
      return res.status(404).json({ message: "Estate not found" });
    }

    if (!estateData.auctionData || !estateData.auctionData.duration) {
      return res.status(400).json({ message: "Auction duration not set" });
    }

    // Calculate auction end date
    const auctionEndDate = new Date();
    auctionEndDate.setDate(
      auctionEndDate.getDate() + estateData.auctionData.duration * 7,
    );

    const update = {
      "auctionData.endDate": auctionEndDate,
      status: req.body.status,
    };

    await estate.estateModel.updateOne({ _id: estateId }, update);

    return res.status(200).json({
      message: "Auction approved successfully",
      endDate: auctionEndDate,
    });
  } catch (err) {
    console.error("approveAuction error:", err);
    return res.status(500).json({ error: err.message });
  }
};

async function auctionResult(estateId) {
  try {
    // Get top 3 highest bids for this estate
    const topBids = await bid.bidModel
      .find({ estateId: estateId })
      .sort({ price: -1 }) // descending order
      .limit(3)
      .populate("userId", "name email phoneNumber"); // only select relevant user fields

    return topBids; // array of bids
  } catch (err) {
    console.error("Error in auctionResult:", err);
    return []; // return empty array if something goes wrong
  }
}

async function auctionEnd(estateId) {
  try {
    const estateData = await estate.estateModel.findById(estateId);
    if (
      !estateData ||
      !estateData.auctionData ||
      !estateData.auctionData.endDate
    ) {
      return { status: true, daysRemain: 0, auctionOwner: null }; // consider auction ended if no data
    }
    const now = new Date();
    const auctionEndDate = new Date(estateData.auctionData.endDate);
    const diffMs = auctionEndDate.getTime() - now.getTime();
    const daysRemain = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return {
      status: daysRemain < 0, // true if auction ended
      daysRemain: daysRemain >= 0 ? daysRemain : 0,
      auctionOwner: estateData.sellerId,
    };
  } catch (err) {
    console.error("Error in auctionEnd:", err);
    return { status: true, daysRemain: 0, auctionOwner: null }; // treat errors as auction ended
  }
}

exports.auctionOperations = async function (req, res) {
  try {
    const estateId = req.params.estateId;

    const auctionEndStatus = await auctionEnd(estateId);

    // If auction ended
    if (auctionEndStatus.status) {
      // If owner requests results
      if (auctionEndStatus.auctionOwner.toString() === req.user.id) {
        const result = await auctionResult(estateId);

        return res.status(200).json({
          ended: true,
          results: result,
        });
      } else {
        return res.status(200).json({
          ended: true,
          message: "Auction ended",
        });
      }
    }
    // If auction still running
    return res.status(200).json({
      ended: false,
      daysRemain: auctionEndStatus.daysRemain,
    });
  } catch (err) {
    console.error("auctionOperations error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/*---------------------------- Sprint 5 ----------------------*/
exports.estateReport = async function (req, res) {
  try {
    const report = {
      type: {},
      category: {},
    };

    const allEstates = await estate.estateModel
      .find({})
      .populate("category")
      .populate("type");

    allEstates.forEach((element) => {
      if (!element.type || !element.category) return;

      const typeName = element.type.name;
      const categoryName = element.category.name;

      // Initialize type if not exists
      if (!report.type[typeName]) {
        report.type[typeName] = { name: typeName, value: 0 };
      }

      // Initialize category if not exists
      if (!report.category[categoryName]) {
        report.category[categoryName] = 0;
      }

      // Count type total
      report.type[typeName].value += 1;

      // Count type + category
      report.type[typeName][categoryName] =
        (report.type[typeName][categoryName] || 0) + 1;

      // Count category total
      report.category[categoryName] += 1;
    });

    // Convert category object to array
    const categoryArray = Object.entries(report.category).map(
      ([name, value]) => ({ name, value }),
    );

    // Convert type object to array
    const typeArray = Object.values(report.type);

    res.status(200).json({
      type: typeArray,
      category: categoryArray,
    });
  } catch (error) {
    console.error("estateReport error:", error);
    res.status(500).json({ error: error.message });
  }
};

/*---------------------------- Sprint 6 ----------------------*/
exports.predictEstatePrice = async function (req, res) {
  try {
    const { categoryId, typeId } = req.body;

    if (!categoryId || !typeId) {
      return res.status(400).json({
        message: "categoryId and typeId are required",
      });
    }

    // Find similar estates
    const estates = await estate.estateModel.find({
      category: categoryId,
      type: typeId,
    });

    if (estates.length === 0) {
      return res.status(404).json({
        message: "No similar estates found",
      });
    }

    // Calculate average price
    const totalPrice = estates.reduce((sum, e) => sum + e.price, 0);
    const avgPrice = totalPrice / estates.length;

    res.status(200).json({
      predictedPrice: Math.round(avgPrice),
      basedOn: estates.length,
    });
  } catch (error) {
    console.error("predictEstatePrice error:", error);
    res.status(500).json({ error: error.message });
  }
};
