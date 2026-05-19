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

      if (!hasDeletedPics && !hasNewPics && !hasNewContract) {
        return helpers.error("object.noChanges");
      }

      return value;
    })
    .messages({
      "object.base": "Invalid data",
      "object.noChanges": "At least one change must be provided",
    }),

  files: joi.object().keys({
    pic: joi.array().items(
      joi.object({
        mimetype: joi.string()
          .valid("image/jpeg", "image/png", "image/webp")
          .required()
          .messages({ "any.only": "Pictures must be JPEG, PNG, or WEBP" }),
        size: joi.number()
          .max(5 * 1024 * 1024)
          .required()
          .messages({ "number.max": "Each picture must be under 5MB" }),
      }).unknown(true)
    ).max(10).messages({
      "array.max": "Cannot upload more than 10 pictures",
    }),

    contract: joi.array().items(
      joi.object({
        mimetype: joi.string()
          .valid("application/pdf")
          .required()
          .messages({ "any.only": "Contract must be a PDF" }),
        size: joi.number()
          .max(10 * 1024 * 1024)
          .required()
          .messages({ "number.max": "Contract must be under 10MB" }),
      }).unknown(true)
    ).max(1).messages({
      "array.max": "Only one contract allowed",
    }),

  }).unknown(true).allow(null),
};


module.exports = {
  updateEstateSchema,
  addEstateSchema,
  updateEstateImageSchema,
};