//importing 
const express = require('express')
const mongoose = require('mongoose');
const Messages = require('./dbMessages.js');
const Pusher = require('pusher');
const Cors = require('cors');

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
//app.use(Cors);

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
            })
        } else {
            console.log('Error triggering pusher');
        }
    })
});

//api routes
app.get('/', (req,res) => res.status(200).send('hello world!!') );

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
