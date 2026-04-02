const {Routes}=require("express");
const{body}=require("express-validator");
const {register,login,getProfile}=require("../controllers/auth.controller");
const {verifyToken}=require("../middlewares/auth.middleware");
const{handleValidationErrors}=require("../middlewares/validate.middleware");

const routes=Router();
router.post("/register",[
    body("username").trim().isLength({min:3}).withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Invalid emailaddress"),
    body("password").isLength({min:6}).withMessage("Password must be at least 6 characters"),
    body("role").optional().isIn(["Admin","Analyst","Viewer"]).withMessage("Invalid role"),
    
],
handleValidationErrors,
register
);

router.post("/login",[
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required")
],
handleValidationErrors,
login
);


routes.get("/profile",verifyToken,getProfile);

module.exports=router;