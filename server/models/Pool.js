const mongoose =require("mongoose");

const PoolSchema = mongoose.Schema({
    pool : {type:Number,required:true}
})

module.exports = mongoose.model("Pool",PoolSchema);