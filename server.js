//importing 
const express = require('express');
const mongoose = require('mongoose');
const Messages = require('./dbMessages.js');
const Rooms = require('./dbRooms');
const Pusher = require('pusher');

//app config
const app = express();
const port = process.env.PORT || 9000;


const pusher = new Pusher({
    appId: '1080344',
    key: '119fa00b5b664f824337',
    secret: 'c6e8fb04732e699f38db',
    cluster: 'us3',
    encrypted: true
  });


//middleware
app.use(express.json());

    app.use((req,res,next)=> {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        next();
    });

//DB config
const connection_url = 'mongodb+srv://admin:cytArANdYNcb2q6i@cluster0.1u5rd.mongodb.net/whatsappdb?retryWrites=true&w=majority';
mongoose.connect(connection_url,{
    useCreateIndex:true,
    useNewUrlParser:true,
    useUnifiedTopology:true,
});

const db = mongoose.connection;

db.once ('open', ()=>{
    const roomCollection = db.collection('rooms');
    const changeStream = roomCollection.watch();

    changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
            const roomDetails = change.fullDocument;
            pusher.trigger('rooms', 'inserted',
            {
                roomName: roomDetails.roomName,
                roomMessages: roomDetails.roomMessages,
                roomMembers: roomDetails.roomMembers,
            }) 
        } else{
            console.log('error triggering pusher rooms')
        }
    })
})

db.once("open" , ()=> {
    console.log('db connected');

    const msgCollection = db.collection('messagecontents');
   
    const changeStream =msgCollection.watch();

    changeStream.on('change', (change) =>{
        console.log('A change occured',change);

        if (change.operationType === 'insert') {
            const messageDetails= change.fullDocument;
            pusher.trigger('messages','inserted',
            {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received,
            })
        } else {
            console.log('Error triggering pusher messages');
        }
    })
});

//api routes
app.get('/', (req,res) => res.status(200).send('hello world!!') );

app.get('/rooms/sync', (req, res) => {
    Rooms.find( (err,data) =>{
        if(err){
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
})

app.post ('/rooms/new', (req,res) => {
    const dbRoom = req.body;

    Rooms.create(dbRoom,(err,data) =>{
        if (err){
            res.status(500).send(err)
        } else {
            res.status(201).send(`new room created: \n ${data}`)
        }
    })
})


app.get('/messages/sync', (req, res) => {
    Messages.find( (err,data) =>{
        if(err){
            res.status(500).send(err)
        } else{
            res.status(200).send(data)
        }
    })
})

app.post ('/messages/new', (req,res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage,(err,data) =>{
        if (err){
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

//listener
app.listen(port, ()=>console.log(`listening on port ${port}`));
