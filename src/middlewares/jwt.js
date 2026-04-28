const { expressjwt: jwt } = require("express-jwt");
const { apiHTTPResponse } = require('../utils/globalFunction');
const { DATA_NULL, HTTP_UNAUTHORIZED, UNAUTHORIZED, HTTP_SERVICE_UNAVAILABLE, SERVICE_UNAVAILABLE, ERROR_TRUE } = require('../utils/constants');
const { UN_AUTHORIZATION_ERROR, SEND_VALID_TOKEN } = require("../utils/constantsDev");
const { ROLES } = require("../utils/roles");

const { JWT_SECRET_KEY } = process.env;

const categoriesPaths = [
    "/api/v1/category/getCategories",
]

const settingsPaths = [
    "/api/v1/setting/country/getAll",
    "/api/v1/setting/state/getAll",
    "/api/v1/setting/city/getAll",
    "/api/v1/setting/zipcode/getAll",
]

const userAuthPaths = [
    "/api/v1/auth/register/step-one",
    "/api/v1/auth/register/step-two",
    "/api/v1/auth/register/step-three",
    "/api/v1/auth/register/step-four",
    "/api/v1/auth/register/step-five",
    "/api/v1/auth/user-login",
    "/api/v1/auth/verify-otp",
    "/api/v1/auth/store-login"
];

const brandsAndBadgesPaths = [
    "/api/v1/brands/getBrands",
    "/api/v1/badge/getBadges",
    "/api/v1/promotions-banner/getAllBanners",
    "/api/v1/discount-coupons/getDiscountCoupons",

]


const productsPaths = [
    "/api/v1/product/getProductReviews",
    "/api/v1/product/getProductFilters",
]


// Define public (unauthenticated) routes
const publicPaths = [
    "/api/v1/auth/login",
    "/api/v1/auth/userLogin",
    "/api/v1/auth/forgotPassword",
    "/api/v1/auth/verifyForgotPasswordOtp",
    "/api/v1/auth/setNewPassword",
    "/api/v1/auth/userRegistration",
    "/api/v1/auth/verifyUserRegistrationOtp",
    "/api/v1/auth/verifyUserRegistrationOtp",
    "/api/v1/deliveryStaff/verifyOtpForStaff", 
        //  deliveryStaff   otp verification
    "/api/v1/deliveryStaff/loginDeliveryStaff",
    ...categoriesPaths,
    ...settingsPaths,
    ...userAuthPaths,
    ...brandsAndBadgesPaths,
    ...productsPaths,
];

const optionallyAuthenticatedPaths = [
    "/api/v1/product/getProductInfo",
    "/api/v1/category/getDashboardCategories",
    "/api/v1/product/getProducts",
    "/api/v1/order/create-test-payment",
    "/api/v1/order/verify-payment",
    "/api/v1/order/payment-webhook",
    "/api/v1/user/global-search",
    "/api/v1/cmsCategory/getALLDocuments",
    "/api/v1/cmsContent/getALLDocuments",

];


// JWT Middleware
const jwtMiddleware = jwt({
    secret: JWT_SECRET_KEY,
    algorithms: ['HS256'],
    credentialsRequired: true,
    requestProperty: "user",
}).unless({
    path: publicPaths,
});

const myCustomCheck = (req, res, next) => {
    if (publicPaths.includes(req.path)) {
        return next();
    }
    const { roleId } = req.user || {};
    if (roleId === ROLES.SUPER_ADMIN) {
        return next();
    }

    return apiHTTPResponse(
        req, res,
        HTTP_UNAUTHORIZED,
        "Access denied. Insufficient permissions.",
        DATA_NULL,
        UNAUTHORIZED,
        ERROR_TRUE
    );
};
 

module.exports = () => {
    return (req, res, next) => {
        jwtMiddleware(req, res, (err) => {
            const isOptionalPath = optionallyAuthenticatedPaths.includes(req.path);

            if (err) {
                if (isOptionalPath) {
                    // Allow even if token is invalid/missing
                    return next();
                }

                // Strict auth required
                if (err.name === UN_AUTHORIZATION_ERROR) {
                    return apiHTTPResponse(
                        req, res,
                        HTTP_UNAUTHORIZED,
                        "Access denied. Please log in to continue.",
                        DATA_NULL,
                        UNAUTHORIZED,
                        ERROR_TRUE
                    );
                } else {
                    return apiHTTPResponse(
                        req, res,
                        HTTP_SERVICE_UNAVAILABLE,
                        "Service temporarily unavailable. Please try again later.",
                        DATA_NULL,
                        SERVICE_UNAVAILABLE,
                        ERROR_TRUE
                    );
                }
            }

            // Valid token or no error
            next();
        });
    };
};
