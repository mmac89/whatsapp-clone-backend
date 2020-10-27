const mongoose = require('mongoose');

const whatsappRoomSchema = mongoose.Schema (
    {
        name:String,
        roomId: String,
        roomName: String,
        roomMessages: Array,
        roomMemebers: Array,
    });

module.exports = mongoose.model('rooms', whatsappRoomSchema);