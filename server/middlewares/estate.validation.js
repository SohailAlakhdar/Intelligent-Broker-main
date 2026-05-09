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


module.exports = {
  updateEstateSchema,
  addEstateSchema,
};