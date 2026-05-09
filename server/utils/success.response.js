exports.successResponse = function ({
    res,
    statusCode = 200,
    message = "Done",
    data = null,
}) {
    return res.status(statusCode).json({
        success: true,
        message: message,
        statusCode: statusCode,
        data: data,
    });
};