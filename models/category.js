const mongoose = require('mongoose');
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const categorySchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        lowercase:true,
        trim:true,
    },
    slug: {
        type: String,
        unique: true,
        slug: "name",
      },
    catCover:{
        type: String,
        required: true
    }

    

},{timestamps:true})

exports.Category = mongoose.model('Category', categorySchema);
