const mongoose = require('mongoose');


const logoSchema = mongoose.Schema({
    url:{
        type: String,
        required:true,
        default:" https://www.mediafire.com/file/95eumy00btih410/AdminLTELogo.png/file"
    }
},{timestamps:true})

module.exports = mongoose.model("logo", logoSchema);

