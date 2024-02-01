import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import Players from "./models/player.js"
import User from "./models/user.js";
import errorHandler from "./middlewares/errorMiddleWare.js";

dotenv.config();

const app = express();

// Create an HTTP server and initialize Socket.IO server with CORS configuration
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

const CONNECTION_URL = process.env.MONGODBURL;

// Connect to MongoDB database
mongoose.connect(CONNECTION_URL)
  .then(() => {
    changesInDB();
    console.log('Connected to MongoDB successfully');
  })
  .catch((err) => {
    console.log('Error connecting to MongoDB:', err.message);
    process.exit(1);
  });

io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

// User login route for authentication
app.post("/login", async (req, res, next) => {
  try {
    const { username, password, slot } = req.body;
    const user = await User.findOne({ username, slot });

    if (!user)
      res.send({ message: "user not found" });

    if (password === user.password) {
      res.send({ message: "login successful", user: user });
    } else {
      res.send({ message: "password does not match" });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

let updateFlag;
let addedPlayer;
let addedPowercard;
let deletedPlayer;
let updatedScore;

// Route to add a new player by admin
app.post("/adminAddPlayer", async (req, res, next) => {
  try {
    const { playerName, teamName, slot, buget } = req.body;
    const user = await User.findOne({ teamName, slot });

    if (!user)
      return res.send({ message: "User not found" });

    const player = await Players.findOne({ playerName });

    if (!player)
      return res.send({ message: "Player not found" });

    // Check if player is already sold in the slot
    const index = player.isSold.indexOf(slot);
    if (index !== -1)
      return res.send({ message: `Player is already sold in slot number ${slot}` });

    // Check if user can buy the player
    const newbuget = user.buget - buget * 10000000;
    if (newbuget < 0)
      return res.send({ message: "Not enough buget" });

    // Update user and player details
    player.isSold.push(slot);
    user.buget = newbuget;
    if (!user.players.includes(player._id)) {
      user.players.push(player._id);
    }
    addedPlayer = player;
    updateFlag = 'insert';
    await Promise.all([user.save(), player.save()]);
    res.send({ message: "New player added successfully", user: user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Route to add a power card by admin
app.post("/adminAddPowerCard", async (req, res, next) => {
  try {
    const { teamName, slot, powercard } = req.body;
    const user = await User.findOne({ teamName, slot });

    if (!user)
      return res.send({ message: "User not found" });

    // Check if powercard already exists for the user
    const result = user.powercards.find(pc => pc.name === powercard);
    if (result)
      return res.send({ message: "Power card already present" });

    // Add power card to user's list
    user.powercards.push({ name: powercard, isUsed: false });
    updateFlag = 'powercardAdded';
    addedPowercard = powercard;
    await user.save();
    res.send({ message: "Power card added successfully", user: user });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// Route to delete a player by admin
app.post("/adminDeletePlayer", async (req, res, next) => {
  try {
    const { playerName, teamName, slot, bugetToAdd } = req.body;
    const user = await User.findOne({ teamName, slot });

    if (!user)
      return res.send({ message: "User not found" });

    const player = await Players.findOne({ playerName });

    if (!player)
      return res.send({ message: "Player not found" });

    // Find index of player in user's player list
    const playerIndex = user.players.findIndex(playerId => playerId.equals(player._id));

    // Handle player not associated with the user
    if (playerIndex === -1)
      return res.send({ message: "Player does not exist with this user" });

    // Remove player from user's player list and update budget
    const index = player.isSold.indexOf(slot);
    player.isSold.splice(index, 1);
    await player.save();
    deletedPlayer = player;
    updateFlag = 'deleted';
    user.buget += bugetToAdd * 10000000;
    user.players.splice(playerIndex, 1);
    await user.save();
    res.send({ message: "Player deleted successfully", user: user });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// Route to update score by calculator
app.post("/calculator", async (req, res, next) => {
  try {
    const { teamName, slot, score } = req.body;
    const user = await User.findOne({ teamName, slot });

    if (!user)
      return res.send({ message: "User not found" });

    // Update user's score
    user.score = score;
    updateFlag = 'scoreUpdate';
    await user.save();
    updatedScore = user.score;
    res.send({ message: "Score updated successfully", user: user });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

function changesInDB() {
  const changeStream = User.watch(); // Create a change stream for the User collection

  changeStream.on('change', () => {
    // Emit Socket.IO events based on updateFlag
    switch (updateFlag) {
      case 'insert':
        console.log(addedPlayer);
        io.emit('playerAdded', { addedPlayer });
        break;

      case 'deleted':
        console.log(deletedPlayer);
        io.emit('playerDeleted', { deletedPlayer });
        break;

      case 'scoreUpdate':
        console.log(updatedScore);
        io.emit('scoreUpdate', { updatedScore });
        break;

      case 'powercardAdded':
        console.log(addedPowercard);
        io.emit('powercardAdded', { addedPowercard });
        break;
    }
  });
}

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

app.use(errorHandler);