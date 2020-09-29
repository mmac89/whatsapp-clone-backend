const mongoose = require('mongoose');

const whatsappSchema = mongoose.Schema({
    message: String,
    name: String,
    time: String,
    received: Boolean,
});

//collection
module.exports= mongoose.model('messagecontents', whatsappSchema)