import mongoose from "mongoose"

const userSchema = mongoose.Schema({
    username:{
        type:String,
        required:[true,"please enter username"]
    }
    ,
    password:{
        type:String,
        required:[true,"please enter password"]
    }
    ,
    slot:{
        type:Number,
        required:[true,"please enter slot number"]
        //min max constraint for this needs to be added
    }

});

export default userSchema