const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    
    email: {
        type: String,
        required: true,
    },
    phoneNumber:{
        type: String,
        required: true,

    },
    region: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },

});




module.exports = mongoose.model('address', addressSchema);
