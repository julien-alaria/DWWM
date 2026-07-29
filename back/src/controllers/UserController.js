import UserModel from "../models/UserModel.js"
import generateToken from "../services/authTokenService.js"
import { sanitizeUser, sanitizeUserUpdate } from "../utils/sanitizer.js"
import AppError from "../utils/AppError.js"

async function getUserPagin(req, res, next) {
    try {
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const results = await UserModel.getUsersPaginated(limit + 1, offset)

        const hasNext = results.length > limit

        if (hasNext) results.pop()

        return res.status(200).json({
            results,
            hasNext
        })

    } catch (error) {
        next(error)
    }
}

async function getMe(req, res, next) {
    try {
        const user_id = req.user.id

        if (!user_id) {
            throw new AppError("Unauthorized" , 401)
        }

        const result = await UserModel.getUsersById(user_id)

        if (!result) {
            throw new AppError("User not found" , 404)
        }

        return res.status(200).json({ result })

    } catch (error) {
        next(error)
    }
}

async function getUserById(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid ID", 400)
        }

        const result = await UserModel.getUsersById(id)

        if (!result) {
            throw new AppError("User not found" , 404)
        }

        res.status(200).json({ result })

    }catch (error) {
        next(error)
    }
}

async function getWatchlist(req, res, next) {
    try {
        const user_id = req.user.id

        const result = await UserModel.getUserWatchlist(user_id)

        return res.status(200).json({ result })

    } catch (error) {
        next(error)
    }
}

async function getWatchlistPagin(req, res, next) {
    try {
        const user_id = req.user.id 
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const results = await UserModel.getUserWatchlistPaginated(user_id, limit + 1, offset)

        const hasNext = results.length > limit

        if (hasNext) results.pop()

        return res.status(200).json({
            results,
            hasNext
        })

    } catch (error) {
        next(error)
    }
}

async function updateUser(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid ID" , 400)
        }

        // clean standard data (name, email, bio...) w/ basic sanitizer
        const sanitizedData = sanitizeUserUpdate(req.body)

        // FILE UPLOADS: this route uses upload.fields([...]), so multer
        // exposes files under req.files.<fieldname>[0], NOT req.file
        // (that property only exists with upload.single()).
        if (req.files?.picture?.[0]) {
            sanitizedData.picture = req.files.picture[0].filename
        }
 
        if (req.files?.document?.[0]) {
            sanitizedData.document = req.files.document[0].filename
        }

        // SECURITY: this route is only accessible by the admin,
        // manually extract 'analyst_verified' from req.body and add it directly after the sanitizer
        if (req.body.analyst_verified !== undefined) {
            sanitizedData.analyst_verified = Number(req.body.analyst_verified) === 1 ? 1 : 0
        }

        // double-check if we have any data to update
        if (Object.keys(sanitizedData).length === 0) {
            throw new AppError("No valid data" , 400)
        }

        // send to the model (already knows how to handle analyst_verified)
        const user = await UserModel.updateUsers(id, sanitizedData)

        return res.status(200).json(user)

    } catch (error) {
        next(error)
    }
}

async function updateMe(req, res, next) {
    try {
        const id = req.user.id

        const sanitizedData = sanitizeUserUpdate(req.body)

        if (req.file) {
            sanitizedData.picture = req.file.filename
        }

        // security: only admins can change role or specialization
        if (sanitizedData.role !== undefined) delete sanitizedData.role
        if (sanitizedData.analyst_type_id !== undefined) delete sanitizedData.analyst_type_id

        if (Object.keys(sanitizedData).length === 0) {
            throw new AppError("No valid data" , 400)
        }

        const result = await UserModel.updateUsers(id, sanitizedData)

        res.status(200).json({ message: "Profil mis à jour avec succès", result })

    } catch (error) {
        next(error)
    }
}

async function deleteMe(req, res, next) {
    try {
        const id = req.user.id

        await UserModel.deleteUsers(id)

        // cascades in DB handle watchlist, follows, recommendations...
        res.status(200).json({ message: "Account deleted successfully" })

    } catch (error) {
        next(error)
    }
}

async function deleteUser(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid ID", 400)
        }

        if (req.user.role !== "admin") {
            throw new AppError("Forbidden", 403)
        }

        await UserModel.deleteUsers(id)

        res.status(200).json({ message : "delete ok" })

    } catch (error) {
        next(error)
    }
}

async function getAnalysts(req, res, next) {
    try {
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 5, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const data = await UserModel.getAllAnalysts(limit, offset)

        return res.status(200).json(data);
    } catch (error) {
        next(error)
    }
}

async function getAnalystsById(req, res, next) {
    try {
        const { id } = req.params;

        const analyst = await UserModel.getAnalystById(id)

        if (!analyst) {
            throw new AppError("Analyst not found", 404)
        }

        res.status(200).json({ results: analyst})
    } catch (error) {
        next(error)
    }
}

async function getAnalystsByType(req, res, next) {
    try {
        const { type_id } = req.query

        if (!type_id) {
            throw new AppError("Missing type_id parameter", 400)
        }

        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

   
        const data = await UserModel.getAnalystsByType(type_id, limit, offset)

        return res.status(200).json(data)

    } catch (error) {
        next(error)
    }
}

async function getPendingAnalyst(req, res, next) {
    try {
        const results = await UserModel.getPendingAnalysts()
        return res.status(200).json({ results })
    } catch (error) {
        next(error)
    }
}

async function followAsset(req, res, next) {
    try {
        const user_id = req.user.id
        const asset_id = req.asset.id

        await UserModel.userFollowAsset(user_id, asset_id)

        return res.status(201).json({
            message: "asset added to favorites"
        })

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
            throw new AppError("Asset already followed" , 409)
        } 
        next(error)
    }
}

async function unfollowAsset(req, res, next) {
    try {
        const user_id = req.user.id
        const asset_id = req.asset.id

        await UserModel.userUnfollowAsset(user_id, asset_id)

        return res.status(200).json({
            message: "asset removed from favorites (or was not followed)"
        })

    } catch (error) {
        next(error)
    }
}

async function getFollowedUser(req, res, next) {
    try {
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const data = await UserModel.getFollowedUsers(
            req.user.id,
            limit,
            offset
        )

        return res.status(200).json(data)

    } catch (error) {
        next(error)
    }
}

async function followUser(req, res, next) {
    try {
        const user_id = req.user.id
        const followUser_id = Number(req.params.id)

        if (req.user.id === Number(req.params.id)) {
            throw new AppError("Cannot follow yourself", 400)
        }

        await UserModel.userFollowUser(user_id, followUser_id)

        return res.status(201).json({ message: "user followed successfully" })

    } catch (error) {

        if (error.code === "ER_DUP_ENTRY") {
        throw new AppError("User already followed", 409)
        }
        next(error)
    } 
}

async function unfollowUser(req, res, next) {
    try {
        const user_id = req.user.id
        const followUser_id = req.params.id

        await UserModel.userUnfollowUser(user_id, followUser_id)

        return res.status(200).json({ message: "user unfollowed successfully"})

    } catch (error) {
        next(error)
    }
}

async function checkIfFollowing(req, res, next) {
    try {
        const user_id = req.user.id // Retrieved via AuthMiddleware()
        const followUser_id = req.params.id

        const isFollowing = await UserModel.isFollowing(user_id, followUser_id)

        return res.status(200).json({ isFollowing: isFollowing })
    } catch (error) {
        console.error("CHECK FOLLOWING ERROR:", error)
        next(error)
    }
}

export default { 
    getUserPagin, 
    getUserById, 
    updateUser,
    getAnalysts, 
    deleteUser, 
    getAnalystsById,
    getAnalystsByType,
    getPendingAnalyst,
    getFollowedUser,
    followAsset, 
    unfollowAsset,
    followUser,
    unfollowUser, 
    getWatchlistPagin,
    getMe, 
    updateMe,
    deleteMe,
    checkIfFollowing,
    getWatchlist
}