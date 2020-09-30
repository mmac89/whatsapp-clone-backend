const mongoose = require('mongoose');

const whatsappRoomSchema = mongoose.Schema (
    {
        roomName: String,
        roomMessages: Array,
        roomMemebers: Array,
    });

module.exports = mongoose.model('rooms', whatsappRoomSchema);