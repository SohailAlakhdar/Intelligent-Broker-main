const joi = require("joi");
const { generalFields } = require("./validation.middleware.js");

const addUserSchema = {
    body: joi.object().keys({
        name: generalFields.name,
        email: generalFields.email,
        password: joi.string().min(6).max(1024).required().messages({
            "string.empty": "Password is required",
            "string.min": "Password must be at least 6 characters long",
            "string.max": "Password must be less than 1024 characters long",
        }),
        phone: joi.string().pattern(/^\d{10}$/).required().messages({
            "string.empty": "Phone number is required",
            "string.pattern.base": "Phone number must be a valid 10-digit number",
        }),
    }).required()
        .messages({
            "object.base": "Invalid user data",
        }),
};


module.exports = {
    addUserSchema
};