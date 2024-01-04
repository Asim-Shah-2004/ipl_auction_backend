import  express  from "express"
import mongoose from "mongoose"
import cors from "cors"
import Players from "./models/player.js"
import User from "./models/user.js"
import Team from "./models/teams.js"
import errorHandler from "./middlewares/errorMiddleware.js"
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(errorHandler);
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


//user verification
//test completed for login
app.post("/login", async (req, res) => {
    try {
       const { username, password, slot } = req.body;
       const user = await User.findOne({ username, slot });
 
       if (user) {
          if (password === user.password) {
             res.send({ message: "login successful", user: user });
          } else {
             res.send({ message: "password does not match" });
          }
       } else {
          res.send({ message: "user not found" });
       }
    } catch (err) {
       console.log(err);
       next(err);
    }
 });
 
 