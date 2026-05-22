const joi = require("joi");
const { generalFields } = require("./validation.middleware.js");


const getAllEstatesSchema = {
  params: joi
    .object()
    .keys({
      partition: joi.number().integer().min(0).required(),
    })
    .required()
    .messages({
      "object.base": "Invalid params",
      "number.base": "Partition must be a number",
      "number.integer": "Partition must be an integer",
      "number.min": "Partition must be 0 or greater",
    }),
};

const updateEstateSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    address: generalFields.address.optional(),
    price: joi.number().min(1).max(200000000).optional(),
    numOfRooms: joi.number().integer().min(1).max(30).optional(),
    numOfBathRooms: joi.number().integer().min(1).max(30).optional(),
    floor: joi.number().integer().min(0).max(163).optional(),
    size: joi.number().min(20).max(10000).optional(),
    desc: joi.string().min(30).max(3000).optional(),
    addressOnMap: joi.array().items(joi.number()).length(2).optional(),
    type: generalFields.id.optional(),
    category: generalFields.id.optional(),
    auctionData: joi.object({
      duration: joi.number().integer().min(1).max(52),
    }).optional(),
  }).required()
    .custom((value, helpers) => {
      // Must have at least one field besides estateId
      const { estateId, ...rest } = value;
      if (Object.keys(rest).length === 0) {
        return helpers.error("object.noChanges");
      }
      return value;
    })
    .messages({
      "object.base": "Invalid estate data",
      "object.noChanges": "At least one field must be provided to update",
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
  files: generalFields.files,
};

const updateEstateImageSchema = {

  body: joi.object().keys({
    estateId: generalFields.id.required(),
    deletedPicNames: joi.alternatives().try(
      joi.array().items(joi.string()).min(1),
      joi.string().allow("")
    ),
  }).required()
    .custom((value, helpers) => {
      const { deletedPicNames } = value;
      const files = helpers.prefs.context?.files;

      const hasDeletedPics = Array.isArray(deletedPicNames)
        ? deletedPicNames.length > 0
        : deletedPicNames && deletedPicNames.trim() !== ""; const hasNewPics = files?.pic?.length > 0;
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
          .valid("application/pdf", "image/jpeg", "image/png", "image/jpg")
          .required()
          .messages({ "any.only": "Contract must be a PDF or image" }),
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
const deleteEstateSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
  }).required(),
};
const approveEstateSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    status: generalFields.status.required(),
  }).required()
    .messages({
      "object.base": "Invalid data",
    }),
};

const addAndUpdateRateSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    rate: joi.number().min(0).max(5).required(),
  }).required()
    .messages({
      "object.base": "Invalid rating data",
    }),
};

const getRatesSchema = {
  query: joi.object().keys({
    partition: joi.number().integer().min(0).default(0),
  }),
};

const placeBidSchema = {
  body: joi
    .object()
    .keys({
      estateId: generalFields.id.required(),
      price: generalFields.price.required(),
    })
    .required()
    .messages({
      "object.base": "Invalid bid data",
    }),
};

const searchSchema = {
  body: joi
    .object()
    .keys({
      text: joi.string().trim().min(1),
      category: generalFields.id,
      type: generalFields.id,
      floor: joi.number().integer().min(0),
      partition: joi.number().integer().min(0).default(0),
      price: joi
        .array()
        .items(joi.number().min(0))
        .length(2)
        .custom((value, helpers) => {
          if (value[0] > value[1]) {
            return helpers.error("any.invalid");
          }
          return value;
        }),
      size: joi
        .array()
        .items(joi.number().min(0))
        .length(2)
        .custom((value, helpers) => {
          if (value[0] > value[1]) {
            return helpers.error("any.invalid");
          }
          return value;
        }),
    })
    .messages({
      "object.base": "Invalid search data",
      "any.invalid": "Min value cannot be greater than max value",
      "array.length": "Price and size filters must have exactly 2 values [min, max]",
    }),
};

const scheduleVisitSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    date: joi.string().required(),
  }).required()
    .messages({
      "object.base": "Invalid visit scheduling data",
    }),
};
const approveScheduleVisitSchema = {
  body: joi.object().keys({
    estateId: generalFields.id.required(),
    visitId: generalFields.id.required(),
  }).required()
    .messages({
      "object.base": "Invalid visit approval data",
    }),
};

module.exports = {
  updateEstateSchema,
  addEstateSchema,
  updateEstateImageSchema,
  placeBidSchema,
  getAllEstatesSchema,
  searchSchema,
  approveEstateSchema,
  addAndUpdateRateSchema,
  getRatesSchema,
  deleteEstateSchema,
  scheduleVisitSchema,
  approveScheduleVisitSchema,
};
