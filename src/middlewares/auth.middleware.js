const jwt=require("jsonwebtoken");
const User=require("../models/user.model");

const verifytoken=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({success:false,message:"Access denied No token provided"});
        
    }

    const token=authHeader.split(" ")[1];

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }catch(err){
        return res.status(401).json({
            success:false,messgae:"Invalid or expired token"
        });
    }
};

const authorizeRoles=(...roles)=>{
    return(req,res,next)=>{
        if(!req.user || !roles.includes(req.user.roles)){
            return res.status(403).json({
                success:false,
                message:`Access denied Required role(s):${roles.join(', ')}.`,

            });
        }next();
    };
};

module.exports={verifytoken,authorizeRoles};