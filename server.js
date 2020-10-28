//========importing========
const express = require("express");
const mongoose = require("mongoose");
const Messages = require("./dbMessages.js");
const Rooms = require("./dbRooms");
const Pusher = require("pusher");

//========app config========
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: "1080344",
  key: "119fa00b5b664f824337",
  secret: "c6e8fb04732e699f38db",
  cluster: "us3",
  encrypted: true,
});

//========middleware========
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

//========DB config========
const connection_url =
  "mongodb+srv://admin:cytArANdYNcb2q6i@cluster0.1u5rd.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("db connected");
  const roomCollection = db.collection("rooms");
  const changeStream = roomCollection.watch({ fullDocument: "updateLookup" });

  changeStream.on("change", (change) => {
    const roomDetails = change.fullDocument;
    console.log(`there has been a change `);
    if (change.operationType === "insert") {
      pusher.trigger("rooms", "inserted", {
        roomName: roomDetails.roomName,
        roomMessages: {},
        roomMembers: roomDetails.roomMembers,
        roomId: roomDetails._id,
      });
    } else if (change.operationType === "update") {
      const messageDetails = change.updateDescription.updatedFields;
      pusher.trigger("rooms", "updated", {
        roomMessages: roomDetails.roomMessages,
      });
    } else {
      console.log("error triggering pusher rooms");
    }
  });
});

// name: roomDetails.roomMessages.name,
//           message: roomDetails.roomMessage.message,
//           timestamp: roomDetails.roomMessage.timestamp,
//           sent: roomDetails.roomMessage.sent,

//========api routes========
app.get("/", (req, res) => res.status(200).send("hello world!!"));

app.get("/rooms/sync", (req, res) => {
  Rooms.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/rooms/new", (req, res) => {
  const dbRoom = req.body;
  Rooms.create(dbRoom, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
        console.log(data);
      res.status(201).send(`new room created: \n ${data}`);
    }
  });
});

app.post("/messages/:roomId/new", async (req, res) => {
  const dbMessage = req.body;
  const _id = req.params.roomId;
  const room = await Rooms.findById(_id, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
      //   console.log("this is the new message -->   " + data);
    }
  });
  room.roomMessages.push(dbMessage);

  //   console.log("this is the new message -->   " + room);
  const updatedRoom = await room.save();
});

app.get("/getRoomName/:roomId", async (req, res) => {
  const _id = req.params.roomId;

  const roomName = await Rooms.findById(_id, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

//========listener========
app.listen(port, () => console.log(`listening on port ${port}`));
