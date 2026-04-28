const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { ROLES } = require("../../../../utils/roles");
const { addTimeStamp } = require("../../../../utils/globalFunction");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    userName: {
        type: String,
        trim: true,
        lowercase: true
    },
    full_name: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    specialist: {
        type: [String],
        enum: ['male', 'female', 'kid'],
        default: []
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        trim: true
    },
    country_code: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
        default: null
    },
    phone: {
        type: String,
        trim: true,
        default: null
    },
    fcm_token: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        trim: true,
    },
    dob: {
        type: Date,
        default: null
    },
    verified: {
        type: Boolean,
        default: false
    },
    user_image: {
        type: String,
        default: null
    },
    role_id: {
        type: Number,
        enum: Object.values(ROLES),
        default: ROLES.USER
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
            default: [0, 0]
        },
        address_string: {
            fullAddress: { type: String, trim: true },
            pincode: { type: String, trim: true },
            country: { type: String, trim: true },
            state: { type: String, trim: true },
            city: { type: String, trim: true },
            streetAddress: { type: String, trim: true },
        },
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    fcm_token: {
        type: String
    },
    phone_verified: {
        type: Boolean,
        default: false
    },
    email_verified: {
        type: Boolean,
        default: false
    },
    enable_notification: {
        type: Boolean,
        default: true
    },
    ...addTimeStamp()
});


UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const hashNumber = Number(process.env.SALT_WORK_FACTOR) || 10;
        const salt = await bcrypt.genSalt(hashNumber);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        console.error("Error in hashing password:", err);
        next(err);
    }
});

UserSchema.options.toJSON = {
    transform: function (doc, ret, options) {
        delete ret.__v;
        delete ret.password;
        return ret;
    }
};

module.exports = mongoose.model("User", UserSchema, "User"); 