const{validationResult}=require("express-validator");

const handleValidationErros=(req,res,next)=>{
    const erros=validationResult(req);
    if(!erros.isEmpty()){
        return res.status(422).json({success:false,errors:erros.array()});

    }next();


};

module.exports={handleValidationErros};