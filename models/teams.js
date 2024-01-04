import mongoose from "mongoose"

const teamSchema = mongoose.Schema({
    name:{
        type:String,
        reqired:[true,"team name required"]
    }
    ,
    buget:{
        type:Number,
        required:[true,"invalid buget"],
        max:950000000,
        min:0
    },
    slot:{
        type:Number,
        required:[true,"slot name required"],
        //min max needs to be added
    },
    score:{
        type:Number,
        required:[true,"invalid score"],
        min:0
    },
    players:[{
        type:mongoose.Schema.ObjectId,
        ref:"Players"
    }],
    powercards:[{
        name:{type:String},
        isUsed:{type:Boolean}
    }]
},{collection:"Team"});

const Team = mongoose.model("Team",teamSchema);

export default Team