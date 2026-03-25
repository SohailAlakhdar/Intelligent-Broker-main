import { generalFields } from "../middlewares/validation.middleware.js";
import joi from "joi";

export const updateEstateImage = {
    body: joi.object().keys({
        estateId: generalFields.id.required(),
    }),
    files: joi.object().keys({ lang: generalFields.lang.optional() }),
};