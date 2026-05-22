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
const { validateFiles } = require("../middlewares/validation.middleware.js");

async function picAddOperation(files, estate) {
  if (!files) return;

  if (files.contract) {
    estate.contract = {
      path: files.contract[0].path,
      name: files.contract[0].filename,
    };
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
    if (!picsToDelete?.length) return;

    const deletePromises = picsToDelete.map((name) =>
      cloudinary.uploader.destroy(name),
    );

    const results = await Promise.all(deletePromises);
    // console.log({ results: results });

    results.forEach((result, i) => {
      if (result.result !== "ok" && result.result !== "not found") {
        // 'not found' means already deleted or never existed → not an error
        throw new Error(`Failed to delete: ${picsToDelete[i]}`);
      }
    });
    // console.log("All pictures deleted successfully");
  } catch (err) {
    console.error("Error deleting pictures:", err);
    throw err;
  }
}

async function CheckTypeAndCategoryExists(params) {
  if (params.type && !await type.estateTypeModel.findById(params.type)) {
    return { error: "Estate type not found" };
  }
  if (params.category && !await category.categoryModel.findById(params.category)) {
    return { error: "Category not found" };
  }
}

exports.getAllEstates = async function (req, res) {
  try {
    // validation
    const partition = Number(req.params.partition);

    if (isNaN(partition) || !Number.isInteger(partition) || partition < 0) {
      return res.status(400).json({
        message: "partition must be a positive integer or 0",
      });
    }

    const skipCount = partition * 60;
    const estates = await estate.estateModel
      .find({ status: "approved" })
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
    const estateDoc = await estate.estateModel.findById(req.body.estateId);
    if (!estateDoc) {
      return res.status(404).json({ error: "Estate not found" });
    }
    if (
      !estateDoc.sellerId.equals(req.user.id) &&
      req.user?.admin !== true
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    // Delete estate
    await estate.estateModel.findByIdAndDelete(req.body.estateId);

    // Delete images from cloudinary
    await picDeleteOperation(
      [
        estateDoc.contract?.name,
        ...estateDoc.pic.map((p) => p.name),
      ].filter(Boolean),
    );

    await Promise.all([
      save.savedModel.deleteMany({ estateId: req.body.estateId }),
      rate.rateModel.deleteMany({ estateId: req.body.estateId }),
      visit.visitModel.deleteMany({ estateId: req.body.estateId }),
      bid.bidModel.deleteMany({ estateId: req.body.estateId }),
    ]);

    return res.status(200).json({ message: "Done" });
  } catch (err) {
    console.error("deleteEstate error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.findEstate = async function (req, res) {
  try {
    const doc = await estate.estateModel
      .findById(req.params.estateId)
      .populate("category")
      .populate("type")
      .populate("sellerId", "name email");

    if (!doc) {
      return res.status(404).json({ message: "Estate not found" });
    }

    res.status(200).json(doc);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addEstate = async function (req, res) {
  // Validate file types
  const fileErrors = validateFiles(req.files);
  if (fileErrors.length > 0) {
    return res.status(400).json({ errors: fileErrors });
  }

  const checkError = await CheckTypeAndCategoryExists(req.body);
  if (checkError?.error) {
    return res.status(404).json({ error: checkError.error });
  }

  let newEstate;
  try {
    // add estate to DB
    newEstate = new estate.estateModel({
      address: req.body.address,
      price: req.body.price,
      numOfRooms: req.body.numOfRooms,
      numOfBathRooms: req.body.numOfBathRooms,
      floor: req.body.floor,
      size: req.body.size,
      type: req.body.type,
      category: req.body.category,
      auctionData: req.body.auctionData,
      desc: req.body.desc,
      sellerId: req.user.id,
      addressOnMap: req.body.addressOnMap,
    });
    console.log("Add");
    await picAddOperation(req.files, newEstate);
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
    const estateDoc = await estate.estateModel
      .findOne({
        _id: req.body.estateId,
        sellerId: req.user.id,
        status: { $ne: "pending" },
      })
      .select("pic contract");

    if (!estateDoc) {
      return res.status(404).json({ message: "Estate not found" });
    }
    let deletedPics = [];
    // ---------------- PICTURES HANDLING ----------------
    if (req.body.deletedPicNames) {
      deletedPics = Array.isArray(req.body.deletedPicNames)
        ? req.body.deletedPicNames
        : [req.body.deletedPicNames];

      // Validate pics belong to this estate
      const estateDocPicNames = estateDoc.pic.map((pic) => pic.name);
      const invalidPics = deletedPics.filter(
        (name) => !estateDocPicNames.includes(name)
      );
      if (invalidPics.length > 0) {
        return res.status(400).json({
          message: "Some pictures do not belong to this estate",
          invalidPics,
        });
      }
      // Check total pics won't exceed 10
      const remainingPics = estateDoc.pic.length - deletedPics.length;
      const newPics = req.files?.pic?.length || 0;
      if (remainingPics + newPics > 10) {
        return res.status(400).json({
          message: `Cannot exceed 10 images. You have ${remainingPics} remaining and are adding ${newPics}`,
        });
      }
      // Delete from cloudinary
      await picDeleteOperation(deletedPics);

      // Remove from DB array
      estateDoc.pic = estateDoc.pic.filter(
        (pic) => !deletedPics.includes(pic.name)
      );
    }
    // ---------------- CONTRACT HANDLING ----------------
    if (req.files?.contract && estateDoc.contract?.name) {
      await picDeleteOperation([estateDoc.contract.name]);
    }

    // ---------------- ADD NEW FILES ----------------
    try {
      await picAddOperation(req.files, estateDoc);
    } catch (uploadError) {
      console.error("Upload failed after deletion:", uploadError);
      return res.status(500).json({ message: "Failed to upload new images" });
    }
    await estateDoc.save();
    res.status(200).json({
      message: "Done",
      data: estateDoc,
    });
  } catch (error) {
    console.error("updateEstateImage error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateEstate = async function (req, res) {
  try {
    const checkError = await CheckTypeAndCategoryExists(req.body);
    if (checkError?.error) {
      return res.status(404).json({ error: checkError.error });
    }
    const estateDoc = await estate.estateModel.findById(req.body.estateId);
    if (!estateDoc) {
      return res.status(404).json({ error: "Estate not found" });
    }
    if (
      !estateDoc.sellerId.equals(req.user.id) &&
      req.user?.admin !== true
    ) {
      return res.status(403).json({ error: "Not authorized" });
    }
    const updatedEstate = await estate.estateModel.findByIdAndUpdate(
      req.body.estateId,
      { ...req.body },
      { new: true, runValidators: true },
    );
    if (!updatedEstate) {
      return res.status(404).json({ message: "Estate not found" });
    }
    res.status(200).json({ message: "Done", estate: updatedEstate });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.approveEstate = async function (req, res) {
  try {
    // find estate first
    const existingEstate = await estate.estateModel.findById(req.body.estateId);

    // check if estate exists
    if (!existingEstate) {
      return res.status(404).json({
        message: "Estate not found",
      });
    }
    // check if already approved
    if (existingEstate.status === "approved") {
      return res.status(400).json({
        message: "Estate is already approved",
      });
    }

    // update estate
    const updatedEstate = await estate.estateModel
      .findOneAndUpdate(
        { _id: req.body.estateId },
        { status: req.body.status },
        { new: true },
      )
      .populate("sellerId", "email");

    // send email notification
    // await emailNotification.estateNotification(updatedEstate);

    res.status(200).json({
      message: "Estate updated successfully",
      data: updatedEstate,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      message: "Error updating estate",
      error: err.message,
    });
  }
};

exports.getCategoryAndType = async function (req, res) {
  try {
    const [categories, types] = await Promise.all([
      category.categoryModel.find({}).exec(),
      type.estateTypeModel.find({}).exec(),
    ]);

    res.status(200).json({
      category: categories,
      type: types,
    });
  } catch (error) {
    console.error("getCategoryAndType error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getApproveEstateRequests = async function (req, res) {
  try {
    const partition = Number(req.query.partition) || 0;
    const skipCount = partition * 60;

    const approveReq = await estate.estateModel
      .find({ status: "pending" })
      .skip(skipCount)
      .limit(60)
      .populate("category")
      .populate("type");

    res.status(200).json(approveReq);
  } catch (error) {
    console.error("getApproveEstateRequests error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMyEstates = async function (req, res) {
  try {
    const partition = Number(req.query.partition) || 0;
    const skipCount = partition * 60;

    const myEstates = await estate.estateModel
      .find({ sellerId: req.user.id })
      .skip(skipCount)
      .limit(60)
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
  try {
    const rates = await rate.rateModel
      .aggregate()
      .match({ estateId: new Types.ObjectId(estateId) })
      .group({ _id: "$rate", count: { $sum: 1 } });

    let scoreTotal = 0;
    let responseTotal = 0;

    rates.forEach((element) => {
      scoreTotal += element.count * element._id;
      responseTotal += element.count;
    });

    const overallRating = responseTotal > 0
      ? parseFloat((scoreTotal / responseTotal).toFixed(2))
      : 0;

    const modifiedEstate = await estate.estateModel.findOneAndUpdate(
      { _id: estateId },
      { rate: overallRating },
      { new: true },
    );

    if (!modifiedEstate) {
      throw new Error("Estate not found");
    }

    return { rate: modifiedEstate.rate };
  } catch (error) {
    console.error("estateOverAllRate error:", error);
    throw error; // ← let caller handle it
  }
}

exports.addAndUpdateRate = async function (req, res) {
  try {
    // Check estate exists and is approved
    const estateDoc = await estate.estateModel.findOne({
      _id: req.body.estateId,
      status: "approved",
    });
    if (!estateDoc) {
      return res.status(404).json({ error: "Estate not found or not approved" });
    }

    const filter = {
      userId: req.user.id,
      estateId: req.body.estateId,
    };
    const update = {
      rate: req.body.rate,
    };
    const existingRate = await rate.rateModel.findOne(filter);
    if (existingRate) {
      return res.status(400).json({
        error: "You have already rated this estate, you can only update your existing rate"
      });
    }
    await rate.rateModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    const updatedRate = await estateOverAllRate(req.body.estateId);

    res.status(200).json({ message: "Done", rate: updatedRate.rate });
  } catch (error) {
    console.error("addAndUpdateRate error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRates = async function (req, res) {
  try {
    const partition = Number(req.query.partition) || 0;
    const skipCount = partition * 60;

    const result = await rate.rateModel
      .find(
        { userId: req.user.id },
        { _id: 0, __v: 0, userId: 0 },
      )
      .skip(skipCount)
      .limit(60)
      .populate("estateId", "address price pic"); // ← useful to show estate info

    res.status(200).json(result);
  } catch (err) {
    console.error("getRates error:", err);
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
    let filter = { status: "approved", ...req.body };

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
    const { estateId, date, status } = req.body;
    // check these user doesn't have another pending visit for the same estate
    const estateDoc = await estate.estateModel.findOne({
      _id: req.body.estateId,
      visitorId: req.user.id,
    });
    if (!estateDoc) {
      return res.status(404).json({ error: "Estate not found" });
    }
    const visitDoc = await visit.visitModel.findOneAndUpdate(
      { estateId: req.body.estateId, visitorId: req.user.id },
      {
        date: req.body.date,
        status: status || "pending",
      },
      {
        upsert: true,
        new: true,
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
    const allowedStatus = ["approved", "rejected"];

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
    console.log({ user: req.user });

    // Authorization check or admin check
    if (
      !visitDoc.estateId.sellerId.equals(req.user.id) &&
      req.user?.admin == "false"
    ) {
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
    const visits = await visit.visitModel
      .find()
      .populate("estateId")
      .populate("visitorId", "name email phoneNumber");

    const filteredVisits = visits.filter(
      (visitDoc) =>
        visitDoc.estateId &&
        visitDoc.estateId.sellerId?.toString() === req.user.id,
    );


    return res.status(200).json(filteredVisits);
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
    if (!estateData) {
      return res.status(404).json({ error: "Estate not found" });
    }
    if (req.body.price <= estateData.price) {
      return res.status(400).json({
        error: "Bid must be higher than current price",
      });
    }

    // Check if auction ended or if user is auction owner
    const auctionEndStatus = await auctionEnd(req.body.estateId);
    if (auctionEndStatus.status) {
      return res.status(400).json({ error: "Auction has already ended" });
    }
    if (auctionEndStatus.auctionOwner?.toString() === req.user.id) {
      return res.status(403).json({ error: "Auction owner cannot place a bid" });
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
    // console.log({ user: req.user });

    // Send notification
    emailNotification
      .placeBidNotification(req.body.estateId, req.user.email)
      .catch(console.error);
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
    if (!estateData) return res.status(404).json({ error: "Estate not found" });

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
