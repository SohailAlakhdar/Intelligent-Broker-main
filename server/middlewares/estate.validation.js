const joi = require("joi");
const { generalFields } = require("./validation.middleware.js");


const updateEstateSchema = {
  body: joi
    .object().keys({
      _id: generalFields.id.required(),
      status: generalFields.status.required(),
    }
    ).required()
    .messages({
      "object.base": "Invalid update data",
    }),
};




const addEstateSchema = {
  body: joi
    .object()
    .keys({
      sellerId: generalFields.id.required(),
      address: generalFields.address,
      price: generalFields.price,
      numOfRooms: generalFields.numOfRooms,
      numOfBathRooms: generalFields.numOfBathRooms,
      floor: generalFields.floor,
      size: generalFields.size,
      type: generalFields.id.required(),
      category: generalFields.id.required(),
      auctionData: generalFields.auctionData,
      status: generalFields.status,
      desc: generalFields.desc,
      addressOnMap: generalFields.addressOnMap,
      rate: generalFields.rate,
    })
    .required()
    .messages({
      "object.base": "Invalid estate data",
    }),
};
  
const updateEstateImageSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    deletedPicNames: joi.string().allow(""),
  }).required()
    .custom((value, helpers) => {
      const { deletedPicNames } = value;
      const files = helpers.prefs.context?.files;

      const hasDeletedPics = deletedPicNames && deletedPicNames.trim() !== "";
      const hasNewPics = files?.pic?.length > 0;
      const hasNewContract = !!files?.contract;

      // Rule 1: if no changes at all
      if (!hasDeletedPics && !hasNewPics && !hasNewContract) {
        return helpers.error("object.noChanges");
      }

      // Rule 2: deleted pics → must upload new pics
      if (hasDeletedPics && !hasNewPics) {
        return helpers.error("object.missingReplacementPics");
      }

      // Rule 3: contract is handled automatically (replaces old)
      // no extra validation needed

      return value;
    })
    .messages({
      "object.base": "Invalid data for updating estate images",
      "object.noChanges": "At least one change must be provided",
      "object.missingReplacementPics": "You must upload new pictures to replace the deleted ones",
    }),
};


module.exports = {
  updateEstateSchema,
  addEstateSchema,
  updateEstateImageSchema,
};