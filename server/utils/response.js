
exports.asyncHandler = function (fn) {
    return async function (req, res, next) {

        try {

            await fn(req, res, next);

        } catch (error) {

            error.statusCode = error.statusCode || 500;

            return next(error);
        }
    };
};


exports.globalErrorHandling = function (error, req, res, next) {

    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
        stack: process.env.MODE === "DEV" ? error.stack : undefined,
    });
};


exports.successResponse = function ({
    res,
    data = {},
    message = "Done",
    status = 200,
} = {}) {

    return res.status(status).json({
        success: true,
        message: message,
        data: data,
    });
};