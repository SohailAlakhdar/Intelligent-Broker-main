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
const { Types, default: mongoose } = require("mongoose");
const { validateFiles } = require("../middlewares/validation.middleware.js");
const { extractPublicId } = require("../utils/cloudinary.utils.js");

function picAddOperation(files, estate) {
  if (!files) return;

  if (files.contract) {
    estate.contract = {
      path: files.contract[0].path,
      name: files.contract[0].filename,
    };
  }

  if (files.pic) {
    if (!Array.isArray(estate.pic)) estate.pic = [];
    estate.pic.push(
      ...files.pic.map((file) => ({ path: file.path, name: file.filename }))
    );
  }
}

async function picDeleteOperation(picsToDelete) {
  if (!picsToDelete?.length) return;

  const validIds = picsToDelete.filter(
    (id) => typeof id === "string" && id.trim().length > 0
  );
  if (!validIds.length) return;

  const results = await Promise.all(
    validIds.map((name) => cloudinary.uploader.destroy(name))
  );

  results.forEach((result, i) => {
    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Failed to delete: ${validIds[i]}`);
    }
  });
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
    const estateDoc = await estate.estateModel.findById(req.body_id);
    if (!estateDoc) {
      return res.status(404).json({ error: "Estate not found" });
    }

    // Delete estate
    await estate.estateModel.findByIdAndDelete(req.body_id);

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
  // const fileErrors = validateFiles(req.files);
  // if (fileErrors.length > 0) {
  //   return res.status(400).json({ errors: fileErrors });
  // }
  // const checkError = await CheckTypeAndCategoryExists(req.body);
  // if (checkError?.error) {
  //   return res.status(404).json({ error: checkError.error });
  // }
  let newEstate;
  try {
    // add estate to DB
    newEstate = new estate.estateModel(req.body);
    newEstate.sellerId = req.user.id;
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



// exports.updateEstate = async function (req, res) {
//   try {
//     const estateDoc = await estate.estateModel.findById(req.body.estateId);
//     if (!estateDoc) {
//       return res.status(404).json({ error: "Estate not found" });
//     }
//     const updatedEstate = await estate.estateModel.findByIdAndUpdate(
//       req.body.estateId,
//       { ...req.body },
//       { new: true, runValidators: true },
//     );
//     if (!updatedEstate) {
//       return res.status(404).json({ message: "Estate not found" });
//     }
//     res.status(200).json({ message: "Done", estate: updatedEstate });
//   } catch (error) {
//     res.status(500).json(error);
//   }
// };

// exports.updateEstateImage = async function (req, res) {
//   try {
//     const estateDoc = await estate.estateModel
//       .findOne({
//         _id: req.body.estateId,
//         sellerId: req.user.id,
//         status: { $ne: "pending" },
//       })
//       .select("pic contract");

//     if (!estateDoc) {
//       return res.status(404).json({ message: "Estate not found" });
//     }
//     let deletedPics = [];
//     // ---------------- PICTURES HANDLING ----------------
//     if (req.body.deletedPicNames) {
//       deletedPics = Array.isArray(req.body.deletedPicNames)
//         ? req.body.deletedPicNames
//         : [req.body.deletedPicNames];

//       // Validate pics belong to this estate
//       const estateDocPicNames = estateDoc.pic.map((pic) => pic.name);
//       const invalidPics = deletedPics.filter(
//         (name) => !estateDocPicNames.includes(name)
//       );
//       if (invalidPics.length > 0) {
//         return res.status(400).json({
//           message: "Some pictures do not belong to this estate",
//           invalidPics,
//         });
//       }
//       // Check total pics won't exceed 10
//       const remainingPics = estateDoc.pic.length - deletedPics.length;
//       const newPics = req.files?.pic?.length || 0;
//       if (remainingPics + newPics > 10) {
//         return res.status(400).json({
//           message: `Cannot exceed 10 images. You have ${remainingPics} remaining and are adding ${newPics}`,
//         });
//       }
//       // Delete from cloudinary
//       await picDeleteOperation(deletedPics);

//       // Remove from DB array
//       estateDoc.pic = estateDoc.pic.filter(
//         (pic) => !deletedPics.includes(pic.name)
//       );
//     }
//     // ---------------- CONTRACT HANDLING ----------------
//     if (req.files?.contract && estateDoc.contract?.name) {
//       await picDeleteOperation([estateDoc.contract.name]);
//     }

//     // ---------------- ADD NEW FILES ----------------
//     try {
//       await picAddOperation(req.files, estateDoc);
//     } catch (uploadError) {
//       console.error("Upload failed after deletion:", uploadError);
//       return res.status(500).json({ message: "Failed to upload new images" });
//     }
//     await estateDoc.save();
//     res.status(200).json({
//       message: "Done",
//       data: estateDoc,
//     });
//   } catch (error) {
//     console.error("updateEstateImage error:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


exports.updateEstate = async function (req, res) {
  console.log("Update0");

  if (req.file_error) {
    return res.status(400).send(JSON.stringify(req.file_error));
  }

  try {
    const data = await estate.estateModel.findById({ _id: req.body.estateId });
    if (!data) return res.status(404).send(JSON.stringify("Estate not found"));

    if (req.body.deletedPicNames || (req.files && req.files.contract)) {
      const picDeleteNames = req.body.deletedPicNames
        ? req.body.deletedPicNames.split(",")
        : [];

      // Normalize to public_ids once, reuse everywhere
      const normalizedDeleteIds = picDeleteNames
        .map(extractPublicId)
        .filter(Boolean);

      // Filter out deleted pics from existing list
      req.body.pic = data.pic.filter(
        (e) => !normalizedDeleteIds.includes(extractPublicId(e.path))
      );
      console.log("Update1");

      picAddOperation(req.files, req.body);

      // If a new contract was uploaded, queue the old one for deletion
      if (req.files && req.files.contract) {
        if (data.contract && data.contract.path) {
          const oldContractId = extractPublicId(data.contract.path);
          if (oldContractId) normalizedDeleteIds.push(oldContractId);
        }
      } else {
        // No new contract uploaded — keep the existing one
        req.body.contract = data.contract;
      }

      console.log("Update2");
      await picDeleteOperation(normalizedDeleteIds.filter((e) => e.length > 1));
    }

    console.log("Update3");
    if (!req.body.status) req.body.status = "pending";

    await estate.estateModel.updateOne(
      { _id: req.body.estateId },
      { $set: req.body }
    );

    res.status(200).send(JSON.stringify("Ok"));

  } catch (err) {
    console.error("updateEstate error:", err);
    return res.status(500).send(JSON.stringify(err.message || err));
  }
};

exports.approveEstate = async function (req, res) {
  try {
    const { _id, status } = req.body;

    if (!_id || !status) {
      return res.status(400).json({ message: "Missing required fields: _id or status" });
    }

    const updatedEstate = await estate.estateModel.findOneAndUpdate(
      { _id },
      { status },
      { new: true }
    ).populate('sellerId', 'email');

    if (!updatedEstate) {
      return res.status(404).json({ message: "Estate not found" });
    }

    await emailNotification.estateNotification(updatedEstate);

    res.status(200).json({ message: "Estate status updated successfully", data: updatedEstate });

  } catch (err) {
    console.error("approveEstate error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
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
    const approveReq = await estate.estateModel
      .find({ status: "pending" })
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
  try {
    const rates = await rate.rateModel
      .aggregate()
      .match({ estateId: new mongoose.Types.ObjectId(estateId) })
      .group({ _id: '$rate', count: { $sum: 1 } });

    if (!rates.length) {
      return { rate: 0 };
    }

    let scoreTotal = 0;
    let responseTotal = 0;

    rates.forEach(element => {
      scoreTotal += element.count * element._id;
      responseTotal += element.count;
    });

    const overallRating = parseFloat((scoreTotal / responseTotal).toFixed(2));

    await estate.estateModel.findOneAndUpdate(
      { _id: estateId },
      { rate: overallRating }
    );

    return { rate: overallRating };

  } catch (error) {
    console.error('estateOverAllRate error:', error);
    return { error: error.message };
  }
}

exports.addAndUpdateRate = async function (req, res) {
  try {
    const filter = {
      userId: req.user.id,
      estateId: req.body.estateId,
    };
    const update = {
      rate: req.body.rate,
    };
    await rate.rateModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    const updatedRate = await estateOverAllRate(req.body.estateId);
    if (updatedRate.error) {
      return res.status(500).json({ error: "Failed to compute overall rate" });
    }
    res.status(200).json({ message: "Done", rate: updatedRate.rate });
  } catch (error) {
    console.error("addAndUpdateRate error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getRates = async function (req, res) {
  try {
    const rates = await rate.rateModel.find(
      { userId: req.user.id },
      { _id: 0, __v: 0, userId: 0 }
    );
    res.status(200).json(rates);
  } catch (error) {
    console.error("getRates error:", error);
    res.status(500).json({ error: error.message });
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
  const { text, price, size, category, type, location } = req.body; // whitelist known fields

  try {
    const filter = { status: "approved" };

    if (text) {
      if (typeof text !== "string") {
        return res.status(400).json({ error: "text must be a string" });
      }
      filter.$text = { $search: text };
    }

    if (price) {
      if (!Array.isArray(price) || price.length !== 2) {
        return res.status(400).json({ error: "price must be an array of [min, max]" });
      }
      filter.price = { $gte: price[0], $lte: price[1] };
    }

    if (size) {
      if (!Array.isArray(size) || size.length !== 2) {
        return res.status(400).json({ error: "size must be an array of [min, max]" });
      }
      filter.size = { $gte: size[0], $lte: size[1] };
    }

    // Add remaining whitelisted fields only if provided
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (location) filter.location = location;

    const estates = await estate.estateModel
      .find(filter)
      .populate({ path: "category", select: "name -_id" })
      .populate({ path: "type", select: "name -_id" });

    res.status(200).json(estates);
  } catch (err) {
    console.error("search error:", err);
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
    emailNotification.scheduleVisitNotification(visitDoc._id);

    res.status(200).json({ message: "Done", visit: visitDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.approveScheduleVisit = async function (req, res) {
  try {

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
// exports.getVisitsDates = async function (req, res) {
//   try {
//     const { estateId, sellerId, visitorId } = req.query; // use query params, not raw JSON


//     // Build a safe, whitelisted filter
//     const filter = {};
//     if (estateId) filter.estateId = estateId;
//     if (visitorId) filter.visitorId = visitorId;

//     const results = await visit.visitModel
//       .find(filter)
//       .populate("estateId")
//       .populate("visitorId", "name email phoneNumber");

//     if (sellerId) {
//       // Filter by sellerId at DB level would require a different schema/query,
//       // so we filter here but only after fetching the user's own estates
//       const data = { approved: [], rejected: [], pending: [] };

//       results.forEach(item => {
//         if (item.estateId?.sellerId?.toString() !== sellerId) return;
//         if (item.status === "approved") data.approved.push(item);
//         else if (item.status === "rejected") data.rejected.push(item);
//         else if (item.status === "pending") data.pending.push(item);
//       });
//       return res.status(200).json(data);
//     }
//     res.status(200).json(results);
//   } catch (err) {
//     console.error("getVisitsDates error:", err);
//     res.status(500).json({ error: err.message });
//   }
// };

/*---------------------------- Sprint 4 ----------------------*/

exports.approveAuction = async function (req, res) {
  try {
    const estateId = req.body._id;

    const estateData = await estate.estateModel.findById(estateId);
    if (!estateData) return res.status(404).json({ error: "Estate not found" });
    if (!estateData.auctionData.duration) {
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

    emailNotification
      .estateNotification({ ...estateData.toObject(), status })
      .catch(err => console.error("estateNotification error:", err));

    return res.status(200).json({
      message: "Auction approved successfully",
      endDate: auctionEndDate,
    });
  } catch (err) {
    console.error("approveAuction error:", err);
    return res.status(500).json({ error: err.message });
  }
};

exports.placeBid = async function (req, res) {
  try {
    const auctionEndStatus = await auctionEnd(req.body.estateId);
    if (auctionEndStatus.status || auctionEndStatus.auctionOwner === req.user.id) {
      return res.status(400).send(JSON.stringify("Can't place bid on an ended auction"));
    }
    const newBid = new bid.bidModel(req.body);
    newBid.userId = req.user.id;
    await newBid.save();
    await estate.estateModel.updateOne(
      { _id: req.body.estateId },
      { price: req.body.price }
    ).exec();
    emailNotification.placeBidNotification(req.body.estateId); // fire-and-forget is fine
    return res.status(200).send(JSON.stringify("Ok"));

  } catch (error) {
    return res.status(400).send(JSON.stringify(error));
  }
};

async function auctionResult(estateId) {
  const result = await bid.bidModel
    .find({ estateId })
    .sort('-price')
    .limit(3)
    .populate('userId');
  return result;
}

async function auctionEnd(estateId) {
  const estateData = await estate.estateModel.findOne({ _id: estateId });
  if (!estateData) {
    throw new Error(`Estate not found: ${estateId}`);
  }
  const nowDate = new Date();
  const auctionDate = new Date(estateData.auctionData.endDate);
  const diff = auctionDate.getTime() - nowDate.getTime();
  const msInDay = 1000 * 3600 * 24;
  const daysRemain = diff / msInDay;
  return {
    status: daysRemain <= 0,
    daysRemain: Math.floor(daysRemain),
    auctionOwner: estateData.sellerId,
  };
}

exports.auctionOperations = async function (req, res) {
  try {
    const auctionEndStatus = await auctionEnd(req.params.estateId);

    // Auction still ongoing — return remaining time
    if (!auctionEndStatus.status) {
      return res.status(200).json({ daysRemain: auctionEndStatus.daysRemain });
    }
    // Auction ended — return results to everyone
    const response = await auctionResult(req.params.estateId);
    const isOwner = auctionEndStatus.auctionOwner.toString() === req.user.id.toString();
    return res.status(200).json({
      auctionResult: response,
      isOwner,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
};

/*---------------------------- Sprint 5 ----------------------*/
exports.estateReport = async function (req, res) {
  try {
    const allEstates = await estate.estateModel
      .find({})
      .populate('category')
      .populate('type')
      .exec();

    const typeMap = {};
    const categoryMap = {};

    allEstates.forEach(element => {
      if (!element.type?.name || !element.category?.name) return;

      const typeName = element.type.name;
      const categoryName = element.category.name;

      if (!typeMap[typeName]) typeMap[typeName] = { value: 0 };
      typeMap[typeName][categoryName] = (typeMap[typeName][categoryName] || 0) + 1;
      typeMap[typeName].value += 1;

      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
    });
    const category = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    const type = Object.entries(typeMap).map(([name, value]) => ({ name, ...value }));

    return res.status(200).json({ type, category });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || error });
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
