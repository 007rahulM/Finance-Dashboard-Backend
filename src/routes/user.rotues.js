
const {Router}=require("express");
const{getAllUsers, getUserById,updateUser, deleteUser}=require("../controllers/user.controller");
const {verifyToken,authorizeRoles}=require("../middlewares/auth.middleware");

const router=Router();

router.use(verifyToken,authorizeRoles("Admin"));

router.get("/",getAllUsers);
router.get("/:id",getUserById);
router.put("/:id",updateUser);
router.delete("/:id",deleteUser);

module.exports=router;