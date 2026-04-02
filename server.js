
require("dotenv").config();
const express=require("express");
const cors=require("cors");
const rateLimit=require("express-rate-limit");
const connectDB=require("./src/config/db");

const app=express();

//connec to database
connectDB();

//cors() for allowing the API to accept requests from browsers and other endpoints

app.use(cors());

app.use(express.json()); //for parsing JSON request bodies


//use api
// app.use("api/auth",authLimiter,authRoutes);
// app.use("/api/users",userRoutes);
// app.use("/api/records",recordRoutes);

//global error handling 
app.use((err,req,res,next)=>{
    res.status(err.status || 500).json({error:err.message || "Internal Server Error"});
});

//start the server
const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})