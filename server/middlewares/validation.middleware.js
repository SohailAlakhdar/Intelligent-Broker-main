const asyncHandler = require("../utils/response").asyncHandler;
const joi = require("joi");

const generalFields = {
    auctionData: joi.object({
        duration: joi.number()
            .integer()
            .min(1)
            .required(),

        endDate: joi.date()
            .iso()
            .required(),
    }),
    addressOnMap: joi.array()
        .items(
            joi.number().required()
        )
        .length(2)
        .required(),
    rate: joi.number()
        .min(0)
        .max(5),
    desc: joi.string()
        .min(10)
        .max(3000)
        .required(),
    address: joi.string()
        .min(5)
        .max(200)
        .required(),

    price: joi.number()
        .min(1)
        .required(),

    numOfRooms: joi.number()
        .integer()
        .min(1)
        .required(),

    numOfBathRooms: joi.number()
        .integer()
        .min(1)
        .required(),

    floor: joi.number()
        .integer()
        .min(0)
        .required(),

    size: joi.number()
        .min(1)
        .required(),
    status: joi.string().valid("pending", "approved", "rejected").messages({
        "any.only": "Status must be either 'pending', 'approved', or 'rejected'",
    }),

    name: joi.string().messages({
        "string.empty": "Name is required",
        "string.min": "Name must be at least 3 characters long",
    }),

    email: joi.string().messages({
        "string.empty": "Email is required",
        "string.email": "Email must be a valid email address",
    }),

    password: joi.string().min(6).messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 6 characters long",
    }),

    admin: joi.string().valid("true", "false").messages({
        "any.only": "Admin must be either 'true' or 'false'",
    }),

    phone: joi.string().pattern(/^(002|\+2)?01[0125][0-9]{8}$/).messages({
        "string.pattern.base":
            "Phone number must be a valid Egyptian phone number",
    }),

    lang: joi.string().valid("en", "ar").messages({
        "any.only": "Language must be either 'en' or 'ar'",
    }),

    otp: joi.string(),
    tokenid: joi.string(),
    verifyEmailOtp: joi.string(),
    verifyEmail: joi.date(),

    id: joi.string().custom(function (value, helpers) {
        if (!/^[0-9a-fA-F]{24}$/.test(value)) {
            return helpers.error("any.invalid");
        }
        return value;
    }).messages({
        "any.invalid": "ID must be a valid MongoDB ObjectId",
    }),

    authorization: joi.string().required().messages({
        "string.empty": "Authorization header is required",
    }),

    receiverId: joi.string(),
    picture: joi.string(),

    fileSchema: {
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().positive().required(),
    },

    content: joi.string().required(),

};


const validation = function (schema) {
    return asyncHandler(function (req, res, next) {

        var validationErrors = [];

        for (var key in schema) {

            var validationResult = schema[key].validate(req[key], {
                abortEarly: false,
                context: { files: req.files }, // ← pass files as context
            });


            if (validationResult.error) {
                validationErrors.push({
                    field: key,
                    message: validationResult.error.details[0].message,
                });
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                message: "Validation Error",
                details: validationErrors,
            });
        }

        return next();
    });
};


module.exports = {
    generalFields: generalFields,
    validation: validation,
};