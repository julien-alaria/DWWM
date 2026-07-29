import express from "express"
import upload, { withUploadErrors } from "../services/multerConfig.js"

import UserController from "../controllers/UserController.js"
import AuthMiddleware from "../middlewares/authMiddleware.js"
import AssetMiddleware from "../middlewares/assetMiddleware.js"

const userRouter = express.Router()

// public
//userRouter.post("/", UserController.createUser)

//userRouter.get("/analysts", UserController.getAnalystsPagin)

userRouter.get("/analysts", UserController.getAnalysts)

userRouter.get("/analysts/by-type", UserController.getAnalystsByType)

userRouter.get("/analysts/:id", UserController.getAnalystsById)

// self users

// self user info
userRouter.get("/me", AuthMiddleware(), UserController.getMe)
// self user watchlist
userRouter.get("/me/watchlist-paginated", AuthMiddleware(), UserController.getWatchlistPagin)
// self user watchlist
userRouter.get("/me/watchlist", AuthMiddleware(), UserController.getWatchlist)
//assets follow
userRouter.post("/me/follows", AuthMiddleware(), AssetMiddleware(), UserController.followAsset)
// self user update
userRouter.put("/me", AuthMiddleware(), withUploadErrors(upload.single("picture")), UserController.updateMe)
//assets unfollow
userRouter.delete("/me/follows/:ticker", AuthMiddleware(), AssetMiddleware(), UserController.unfollowAsset)
// users follow
userRouter.post("/me/follows/users/:id", AuthMiddleware(), UserController.followUser)
// users unfollow
userRouter.delete("/me/follows/users/:id", AuthMiddleware(), UserController.unfollowUser)
// get users follow
userRouter.get("/me/follows/users", AuthMiddleware(), UserController.getFollowedUser)
// New dedicated route to check if the logged-in user is following this analyst
userRouter.get("/me/follows/users/:id/check", AuthMiddleware(), UserController.checkIfFollowing)

// admin
userRouter.get("/", AuthMiddleware(["admin"]), UserController.getUserPagin)

userRouter.get("/pending-analysts", AuthMiddleware(["admin"]), UserController.getPendingAnalyst)

userRouter.get("/:id", AuthMiddleware(["admin"]), UserController.getUserById)

userRouter.put("/:id", AuthMiddleware(["admin"]), withUploadErrors(upload.fields([ 
    { name: 'picture', maxCount: 1 }, 
    { name: 'document', maxCount: 1 }])), UserController.updateUser)

userRouter.delete("/:id", AuthMiddleware(["admin"]), UserController.deleteUser)

export default userRouter