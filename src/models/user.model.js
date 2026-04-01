//user model and schema defined here

const mongoose =require("mongoose");
const bcrypt=require("bcryptjs");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:true,
        trim:true,
        minlength:[3,"Usernam musst be at least 3 characters"],

    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true,
        lowercae:true,
        trim:true,
        match:[/^\S+@\S+\.\S+$/,"Please provide a valid email address"],

    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minlength:[6,"Password must be at least 6 characters"],

    },
    role:{
        type:String,
        enum:["Admin","Analyst","Viewer"],
        default:"Viewer",

    },
    isActive:{
        type:Boolean,
        default:true,
    },
},
    {timestamps:true}
);


userSchema.pre("save",async function(next){
    if(!this.isModified("password"))
return next();
    
    this.password=await bcrypt.hash(this.password,10);
    next();
});

userSchema.methods.comparePassword=async function(candidatePassword){
    return bcrypt.compare(candidatePassword,this.password);

};

module.exports=mongoose.model("User",userSchema);
