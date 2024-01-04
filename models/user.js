import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please enter username"],
    },
    password: {
        type: String,
        required: [true, "Please enter password"],
    },
    slot: {
        type: Number,
        required: [true, "Please enter slot number"],
        // min max constraint for this needs to be added
    },
}, { collection: 'User' }); // Specify the collection name as 'User'

const User = mongoose.model("User", userSchema);

export default User;
