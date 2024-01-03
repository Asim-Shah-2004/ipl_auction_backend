import  express  from "express"
import mongoose from "mongoose"
import cors from "cors"
import Player from "./models/player.js"
import User from "./models/user.js"
import Team from "./models/teams.js"
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
const CONNECTION_URL = "mongodb://localhost/ipl";

mongoose.connect(CONNECTION_URL,{useNewUrlParser:true,useUnifiedTopology:true,family: 4})
.then(()=>{
    console.log('connected to mongoDB successfully');
}).catch(err=>{console.log('No connection')});

app.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
});

app.get("/",(req,res)=>{
    res.send("<h1>test</h1>");
});

app.get("/login",(req,res)=>{
    const {username,password,slot} = req.body;
    User.findOne({username,slot},(err,user)=>{
        if(err){

        }else if(user){

        }else{
            
        }
    })
})