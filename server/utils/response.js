// export const asyncHandler = (fn) => {
//     return async (req, res, next) => {
//         try {
//             await fn(req, res, next);
//         } catch (error) {
//             // attach cause if needed
//             error.statusCode = error.statusCode || 500;
//             return next(error);
//         }
//     };
// };
// export const globalErrorHandling = async (error, req, res, next) => {
//     return res.status(error.cause || 400).json({
//         error,
//         message: error.message,
//         stack: error.stack,
//     });
// };

// export const successResponse = async ({
//     res,
//     data = {},
//     message = "Done",
//     status = 200,
// } = {}) => {
//     if (!res) {
//         // console.log("Missing response in successResponse?");
//         return;
//     }
//     return res.status(status).json({
//         message,
//         data,
//     });
// };
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