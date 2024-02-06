import  express  from "express"
import mongoose from "mongoose"
import cors from "cors"
import Players from "./models/player.js"
import User from "./models/user.js"
import errorHandler from "./middlewares/errorMiddleWare.js"
import http from "http"
import { Server } from "socket.io"
import dotenv from "dotenv"
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});


const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(errorHandler);

const CONNECTION_URL = `mongodb+srv://IPL_AUCTION_24:${process.env.PASSWORD}@cluster0.ilknu4v.mongodb.net/IPL?retryWrites=true&w=majority`;

mongoose.connect(CONNECTION_URL)
.then(()=>{
    console.log('connected to mongoDB successfully');
}).catch(err=>{console.log('No connection')});

server.listen(PORT,()=>{
    console.log(`listening on port ${PORT}`);
});

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
});

app.get("/",(req,res)=>{
    res.send("<h1>Hello world</h1>");

});


function emitChanges(endpoint,payload){
    io.emit(endpoint,{payload});
}

//user verification
app.post("/login", async (req, res, next) => {
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

let updateFlag;
let addedPlayer;
app.post("/adminAddPlayer", async (req, res ,next) => {
    try {
        const { playerName, teamName, slot, buget } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (user) {
            const player = await Players.findOne({ playerName });

            if (player) {
                const index = player.isSold.indexOf(slot);
                if (index===-1) {
                    const newbuget = user.buget - (buget*10000000);
                    
                    if (newbuget < 0) {
                        return res.send({ message: "Not enough buget" });
                    } else {
                        player.isSold.push(slot);
                        user.buget = newbuget; 
                        if (!user.players.includes(player._id)) {
                            user.players.push(player._id);
                        }
                        addedPlayer = player;
                        updateFlag = 'insert';
                        await user.save();
                        await player.save();
                        const endpoint = `playerAdded${teamName}${slot}`;
                        const payload = player;
                        emitChanges(endpoint,payload);
                        return res.send({message:"New player added successfully",user:user});
                    }
                } else {
                    return res.send({ message: `Player is already sold in slot number ${slot}` });
                }
            } else {
                return res.send({ message: "Player not found" });
            }
        } else {
            return res.send({ message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        next(err);
    }
});

let addedPowercard;
app.post("/adminAddPowerCard", async (req, res ,next) => {
    try {
        const { teamName, slot, powercard } = req.body;
        const user = await User.findOne({ teamName, slot });
        if (user) {
            const result = user.powercards.find(pc => pc.name === powercard);
            if (!result) {
                user.powercards.push({ name: powercard, isUsed: false });
                updateFlag='powercardAdded';
                addedPowercard=powercard;
                await user.save();
                const endpoint = `powercardAdded${teamName}${slot}`;
                const payload = powercard;
                emitChanges(endpoint,payload);
                return res.send({ message: "Power card added successfully" ,user:user});
            } else {
                return res.send({ message: "Power card already present" });
            }
        } else {
            return res.send({ message: "User not found" });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
});

let deletedPlayer;
app.post("/adminDeletePlayer", async (req, res, next) => {
    try {
      const { playerName, teamName, slot, bugetToAdd } = req.body;
      const user = await User.findOne({ teamName, slot });
  
      if (user) {
        const player = await Players.findOne({ playerName });
  
        if (player) {
          const playerIndex = user.players.findIndex(playerId => playerId.equals(player._id));
  
          if (playerIndex !== -1) {
            const index = player.isSold.indexOf(slot);
            player.isSold.splice(index,1);
            await player.save();
            deletedPlayer = player;
            updateFlag = 'deleted';
            user.buget = user.buget + (bugetToAdd*10000000);
            user.players.splice(playerIndex, 1); 
            await user.save();
            const endpoint = `playerDeleted${teamName}${slot}`;
            const payload = player;
            emitChanges(endpoint,payload);
            return res.send({ message: "Player deleted successfully", user: user });
          } else {
            return res.send({ message: "Player does not exist with this user" });
          }
        } else {
          return res.send({ message: "Player not found" });
        }
      } else {
        return res.send({ message: "User not found" });
      }
    } catch (err) {
      next(err);
    }
  });
  

  let updatedScore;
app.post("/calculator",async(req,res,next)=>{
    try{
        const {teamName,slot,score} = req.body;
        const user = await User.findOne({teamName,slot});
        if(user){
        user.score = score;
        updateFlag='scoreUpdate';
        await user.save();
        updatedScore=user.score;
        const endpoint = `scoreUpdate${teamName}${slot}`;
        const payload = score;
        emitChanges(endpoint,payload);
        return res.send({message:"score updated successfully",user});
    }else{
        return res.send({message:"user not found"});
    }
    }catch(err){
        next(err);
    }
});




