const mongoose=require("mongoose");
const financialRecordSchema=new mongoose.Schema({
    title:{
        type:String,
        required:[true,"Title is required"],
        trim:true,

    },
    amount:{
        type:Number,
        required:[true,"Amount is required"],
        min:[0,"Amount cannot be negative"],
    },
    type:{
        type:String,
        enum:["Income","Expense"],
        required:[true,"Type is required"],

    },

    category:{
        type:String,
        required:[true,"Category is required"],
        trim:true,
        enum:["Salary","Rent","Food","Investment","Other"],

    },
    date:{
        type:Date,
        required:[true,"Date is required"],
        default:Date.now,
    },
    notes:{
        type:String,
        trim:true,
        maxlenght:[500,"Notes cannot exceed 500 characters"],

    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:[true,"CreatedBy is required"],

    },
    isDeleted:{
        type:Boolean,
        default:false,

    },
},{timestamps:true}
);

module.exports=mongoose.model("FinancialRecord",financialRecordSchema);