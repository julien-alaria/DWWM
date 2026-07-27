import UserModel from "../models/UserModel.js"
import { sanitizeUser, sanitizeLogin } from "../utils/sanitizer.js"
import { comparePassword } from "../utils/password.js"
import generateToken from "../services/authTokenService.js"
import AppError from "../utils/AppError.js"

async function login(req, res, next) {
    try {
        const { email, password } = sanitizeLogin(req.body)
        const user = await UserModel.getUsersByEmail(email) 

        if (!user) {
            throw new AppError("invalid credentials", 401)
        }

        const isMatch = await comparePassword(password, user.password)

        if(!isMatch) {
            throw new AppError("invalid credentials", 401)
        }

        const token = generateToken(user)

        res.status(200).json({ message: "authorized connection", token })

    } catch (error) {
        next(error)
    }
}

async function register(req, res, next) {
    try {

        const sanitizedData = sanitizeUser(req.body)

        // Multer picture injection
        if (req.files && req.files['picture']) {
            sanitizedData.picture = req.files['picture'][0].filename
        } else {
            sanitizedData.picture = null
        }

        // Multer PDF injection
        if (req.files && req.files['document']) {
            sanitizedData.document = req.files['document'][0].filename
        } else {
            sanitizedData.document = null
        }

        const user = await UserModel.createUsers(sanitizedData)
        const token = generateToken(user)

        res.status(201).json({ user, token })
        
    } catch (error) {
        next(error)
    }
} 

export default { login, register }