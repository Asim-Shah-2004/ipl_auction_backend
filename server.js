import express from "express"
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

const CONNECTION_URL = `mongodb+srv://IPL_AUCTION_24:${process.env.PASSWORD}@cluster0.ilknu4v.mongodb.net/IPL?retryWrites=true&w=majority`;

mongoose.connect(CONNECTION_URL)
    .then(() => {
        console.log('connected to mongoDB successfully');
    }).catch(err => { console.log('No connection') });


io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

app.get("/", (req, res) => {
    res.send("<h1>Hello world</h1>");

});


function emitChanges(endpoint, payload) {
    io.emit(endpoint, { payload });
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
app.post("/adminAddPlayer", async (req, res, next) => {
    try {
        const { playerName, teamName, slot, buget } = req.body;

        const user = await User.findOne({ teamName, slot });

        if (user) {
            const player = await Players.findOne({ playerName });

            if (player) {
                const index = player.isSold.indexOf(slot);
                if (index === -1) {
                    const newbuget = user.buget - (buget * 10000000);

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
                        emitChanges(endpoint, payload);
                        return res.send({ message: "New player added successfully", user: user });
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
app.post("/adminAddPowerCard", async (req, res, next) => {
    try {
        const { teamName, slot, powercard } = req.body;
        const user = await User.findOne({ teamName, slot });
        if (user) {
            const result = user.powercards.find(pc => pc.name === powercard);
            if (!result) {
                user.powercards.push({ name: powercard, isUsed: false });
                updateFlag = 'powercardAdded';
                addedPowercard = powercard;
                await user.save();
                const endpoint = `powercardAdded${teamName}${slot}`;
                const payload = user.powercards;
                emitChanges(endpoint, payload);
                return res.send({ message: "Power card added successfully", user: user });
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
                    player.isSold.splice(index, 1);
                    await player.save();
                    deletedPlayer = player;
                    updateFlag = 'deleted';
                    user.buget = user.buget + (bugetToAdd * 10000000);
                    user.players.splice(playerIndex, 1);
                    await user.save();
                    const endpoint = `playerDeleted${teamName}${slot}`;
                    const payload = player;
                    emitChanges(endpoint, payload);
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

app.patch("/adminUsePowerCard",async (req,res,next)=>{
    const{teamName,slot,powercard} = req.body;
    try{
        const user = await User.findOne({teamName,slot});
        if(user){
            const result = user.powercards.find(pc => pc.name === powercard);
            if(result){
                console.log(result);
                result.isUsed = true;
                await result.save();
                res.send({message:"powercard used  successfully"},{user:user});
            }else{
                res.send({message:"user does not have this powercard"});           
            }
        }else{
            res.send({message:"user not found"});
        }
    }catch(err){
        next(err);
    }
    
})

let updatedScore;
app.post("/calculator", async (req, res, next) => {
    try {
        const { teamName, slot, score } = req.body;
        const user = await User.findOne({ teamName, slot });
        if (user) {
            user.score = score;
            updateFlag = 'scoreUpdate';
            await user.save();
            updatedScore = user.score;
            const endpoint = `scoreUpdate${slot}`;
            const payload = {
                teamName:teamName,
                score:score
            };
            emitChanges(endpoint, payload);
            return res.send({ message: "score updated successfully", user });
        } else {
            return res.send({ message: "user not found" });
        }
    } catch (err) {
        next(err);
    }
});

app.post("/getPlayer", async (req, res, next) => {
    try {
        const { _id } = req.body;
        const player = await Players.findOne({ _id });
        if (player) {
            return res.send(player);
        } else {
            return res.send({ message: "player not found" });
        }

    } catch (err) {
        next(err);
    }
});

app.patch("/adminAllocateTeam", async (req, res, next) => {
    try {
        const { teamName, username, slot, buget } = req.body;
        const user = await User.findOne({ username, slot });
        if (user) {
            if (user.buget - buget < 0) {
                res.send({ message: "not enough buget" });
            } else {
                user.teamName = teamName;
                await user.save();
                console.log();
                const endpoint = `teamAllocate${username}${slot}`;
                const payload = {
                    teamName:teamName,
                    buget:buget
                };
                emitChanges(endpoint, { payload });
                return res.send({ message: "team allocated successfully", user: user });
            }
        } else {
            return res.status(200).send({ message: "user not found" });
        }
    } catch (err) {
        next(err);
    }
})


app.get("/spectate/:teamName/:slot", async (req, res, next) => {
    const teamName = req.params.teamName;
    const slot = req.params.slot;
    try{
        const user = await User.findOne({teamName,slot});
        if(user){
            const newUser = {
                slot:user.slot,
                teamName:user.teamName,
                buget:user.buget,
                score:user.score,
                players:user.players,
                powercards:user.powercards
            }
            res.send({newUser:newUser})
        }else{
            res.send({message:"user not found"});
        }
    }catch(err){
        next(err);
    }    
    
});


server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

app.use(errorHandler);

