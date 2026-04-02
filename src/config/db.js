//here we connect to the mongodb through mongooes 

const mongoose=require("mongoose");
const connectDB=async()=>{
    try{
        const connect=await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected:${connect.connection.host}`);
    }catch(err){
        console.error(`MonogDb connection errors:${err.message}`);
        process.exit(1);
    }
};

module.exports=connectDB;