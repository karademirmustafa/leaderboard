const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
    username : {type : String,required:true,unique:true},
    country : {type : String,required:true},
    money : {type : Number,required: true},
   

},{timestamps:true});

module.exports =mongoose.model("Player",PlayerSchema);