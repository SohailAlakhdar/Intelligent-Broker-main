import { asyncHandlar } from "../utils/response.js";
import joi from "joi";
import { fileValidation } from "../utils/multer/local.multer.js";
import { text } from "stream/consumers";

export const generalFields = {
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
    // age: joi.number().positive().integer().min(15).max(150),
    phone: joi
        .string()
        .pattern(/^(002|\+2)?01[0125][0-9]{8}$/)
        .messages({
            "string.pattern.base":
                "Phone number must be a valid Egyptian phone number",
        }),
    // gender: joi.string().valid("male", "female").messages({
    //     "any.only": "Gender must be either 'male' or 'female'",
    // }),
    lang: joi.string().valid("en", "ar").messages({
        "any.only": "Language must be either 'en' or 'ar'",
    }),
    otp: joi.string(),
    tokenid: joi.string(),
    verifyEmailOtp: joi.string(),
    verifyEmail: joi.date(),
    id: joi
        .string()
        .custom((value, helpers) => {
            if (!/^[0-9a-fA-F]{24}$/.test(value)) {
                return helpers.error("any.invalid");
            }
            return value;
        })
        .messages({
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
        // finalPath: joi.string(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().positive().required(),
    },
    content: joi.string().required(),
};

export const validation = (schema) => {
    return asyncHandlar(async (req, res, next) => {
        // console.log("Schema1", Object.keys(schema));
        // console.log("Schema2",schema)
        let validationErrors = [];
        for (const key in schema) {
            // console.log("key", key );
            // console.log("schema[key]:",schema[key]);
            // console.log("req[key] :::", req[key]);
            const validationResult = schema[key].validate(req[key], {
                abortEarly: false,
            });
            if (validationResult.error) {
                validationErrors.push({
                    field: key,
                    message: validationResult.error.details[0].message,
                });
            }
        }
        // if (validationErrors.length > 0) {
        //     return res.status(400).json({
        //         message: "Validation Error",
        //         details: validationErrors,
        //     });
        // }

        return next();
    });
};

// export const validation = (schema) => {
//     return (req, res, next) => {
//         try {
//             for (const key of Object.keys(schema)) {
//                 const partSchema = schema[key];

//                 // لو اللي جاي مش Joi schema كامل (مجرد حقول) لفّه في joi.object()
//                 const effectiveSchema = joi.isSchema(partSchema)
//                     ? partSchema
//                     : joi.object(partSchema);

//                 const { error, value } = effectiveSchema.validate(req[key], {
//                     abortEarly: false,
//                     allowUnknown: true,
//                 });
//                 if (error) {
//                     return res.status(400).json({
//                         message: "Validation Error",
//                         details: error.details.map((d) => ({
//                             field: key,
//                             message: d.message,
//                         })),
//                     });
//                 }
//                 // اختياري: حط الـ value بعد الـ sanitize
//                 req[key] = value;
//             }
//             next();
//         } catch (e) {
//             next(e);
//         }
//     };
// };
