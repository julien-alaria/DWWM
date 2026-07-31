import getConnection from "../db/connection.js"
import { hashPassword } from "../utils/password.js"
import AppError from "../utils/AppError.js"

async function getUsersPaginated(limit, offset) {
    const db = getConnection()
    
    const l = parseInt(limit, 10);
    const o = parseInt(offset, 10);

    const sql = `
        SELECT id, name, email, role, company, bio, analyst_verified, analyst_type_id, created_at 
        FROM users 
        ORDER BY id DESC 
        LIMIT ? OFFSET ?
    `
    
    const [rows] = await db.query(sql, [l, o]);
    return rows;
}

async function getUsersById(id) {
    const db = getConnection()

    const sql = "SELECT id, name, email, role, analyst_type_id, analyst_verified, company, bio, picture FROM users WHERE id = ?"

    const [result] = await db.execute(sql, [id])

    return result[0] || null
}

async function getUsersByEmail(email) {
    const db = getConnection()

    let sql = "SELECT id, name, email, password, role, analyst_type_id, analyst_verified, company, bio FROM users WHERE email = ?"
    const [result] = await db.execute(sql, [email]) 

    return result[0] || null
}

async function getUserWatchlist(id) {
    const db = getConnection()

    const sql = "SELECT assets.id, assets.ticker, assets.name, assets.asset_type_id FROM assets JOIN users_assets_follow ON users_assets_follow.asset_id = assets.id WHERE users_assets_follow.user_id = ?"

    const [result] = await db.execute(sql, [id])

    return result
}

async function getUserWatchlistPaginated(user_id, limit = 10, offset = 0) {
    const db = getConnection()

    const parsedLimit = Math.max(1, Number.parseInt(limit, 10))
    const parsedOffset = Math.max(0, Number.parseInt(offset, 10))

    const sql = `
        SELECT assets.id, assets.ticker, assets.name, assets.asset_type_id 
        FROM assets 
        JOIN users_assets_follow ON users_assets_follow.asset_id = assets.id 
        WHERE users_assets_follow.user_id = ? 
        ORDER BY assets.name ASC 
        LIMIT ? OFFSET ?
    `
    // Incompatible binary protocol in method .execute() on Windows OS, resolved by switching to textual protocol via .query()
    const [rows] = await db.query(sql, [user_id, parsedLimit, parsedOffset])
    return rows
}

async function createUsers(data) {
    const db = getConnection()

    const { name, email, password, role, analyst_type_id, company, bio, picture, document } = data

    const [existingEmail] = await db.execute("SELECT id FROM users WHERE email = ?",[email])

    if (existingEmail.length > 0) {throw new AppError("Email already used", 409)}

    const hashedPassword = await hashPassword(password)

    if (role === "analyst") {
        const [assetType] = await db.execute("SELECT id FROM assets_types WHERE id = ?", [analyst_type_id])

        if (assetType.length === 0) {
            throw new AppError("Invalid asset type")
        }
    }

    const sql = "INSERT INTO users (name, email, password, role, analyst_type_id, analyst_verified, company, bio, picture, document ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"

    const [result] = await db.execute(sql,
        [name, email, hashedPassword, role, analyst_type_id, false, company, bio, picture, document]
    )

    return {
        id: result.insertId,
        name,
        email,
        role,
        analyst_type_id,
        picture,
        document
    }
}

async function updateUsers(id, data) {
    const db = getConnection()

    const fields = []
    const values = []

    if (data.name !== undefined) {
        fields.push("name = ?")
        values.push(data.name)
    }

    if (data.email !== undefined) {
        fields.push("email = ?")
        values.push(data.email)
    }

    if (data.password !== undefined) {
        const hashed = await hashPassword(data.password)
        fields.push("password = ?")
        values.push(hashed)
    }

    // admin only
    if (data.role !== undefined) {
        fields.push("role = ?")
        values.push(data.role)
    }

    if (data.analyst_type_id !== undefined) {
        const [assetType] = await db.execute(
            "SELECT id FROM assets_types WHERE id = ?",
            [data.analyst_type_id]
        )

        if (assetType.length === 0) {
            throw new AppError("Invalid analyst type")
        }

        fields.push("analyst_type_id = ?")
        values.push(Number(data.analyst_type_id))
    }

    // admin only
    if (data.analyst_verified !== undefined) {
        fields.push("analyst_verified = ?")
        values.push(data.analyst_verified)
    }

    if (data.company !== undefined) {
        fields.push("company = ?")
        values.push(data.company)
    }

    if (data.bio !== undefined) {
        fields.push("bio = ?")
        values.push(data.bio)
    }

    if (data.picture !== undefined) {
        fields.push("picture = ?")
        values.push(data.picture)
    }

    if (data.document !== undefined) {
        fields.push("document = ?")
        values.push(data.document)
    }

    if (fields.length === 0) {
        throw new AppError("No fields to update")
    }

    values.push(id)

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`

    const [result] = await db.execute(sql, values)

    if (result.affectedRows === 0) {
        throw new AppError("User not found")
    }

    return result
}

async function deleteUsers(id) {
    const db = getConnection()

    if (!Number.isInteger(Number(id))) {
        throw new AppError("Invalid ID")
    }

    const sql = 'DELETE FROM users WHERE id = ?'

    const [result] = await db.execute(sql, [id])

    if (result.affectedRows === 0) {
        throw new AppError("User not found")
    }

    return result
}

async function getAllAnalysts() {
    const db = getConnection()

    const sql = "SELECT id, name, company, bio, picture FROM users WHERE role = 'analyst'"

    const [rows] = await db.query(sql)

    return rows
}

async function getAnalystsByType(type_id, limit, offset) {
    const db = getConnection();

    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 5)
    const parsedOffset = Math.max(0, Number.parseInt(offset, 10) || 0)

    const sql = `
        SELECT id, name, company, bio, picture 
        FROM users 
        WHERE role = 'analyst' AND analyst_type_id = ?
        LIMIT ?
        OFFSET ?
    `

    const [rows] = await db.query(sql, [
        type_id,
        parsedLimit + 1,
        parsedOffset
    ])

    const hasNext = rows.length > parsedLimit;

    if (hasNext) rows.pop();

    return {
        results: rows,
        hasNext
    }
}

async function getAnalystById(id) {
    const db = getConnection()

    const sql = "SELECT id, name, company, bio, picture FROM users WHERE role = 'analyst' AND id = ?"

    const [rows] = await db.execute(sql, [id])

    return rows.length > 0 ? rows[0] : null
}

async function getPendingAnalysts() {
    const db = getConnection()

    const [rows] = await db.query(
        "SELECT id, name, email, role, analyst_type_id, analyst_verified, company, bio, picture FROM users WHERE role = 'analyst' AND analyst_verified = 0"
    )

    return rows
}

async function userFollowAsset(user_id, asset_id) {
    const db = getConnection()

    if (!Number.isInteger(user_id) || !Number.isInteger(asset_id)) {
        throw new AppError("Invalid ID")
    }

    const sql = "INSERT INTO users_assets_follow (user_id, asset_id) VALUES (?, ?)"

    const [result] = await db.execute(sql, [user_id, asset_id])

    return result
}

async function userUnfollowAsset(user_id, asset_id) {
    const db = getConnection()

    const sql = "DELETE FROM users_assets_follow WHERE user_id = ? AND asset_id = ?"

    const [result] = await db.execute(sql, [user_id, asset_id])

    return result
}

async function getFollowedUsers(id, limit, offset) {
    const db = getConnection();

    const parsedLimit = Math.max(1, Number.parseInt(limit, 10) || 5)
    const parsedOffset = Math.max(0, Number.parseInt(offset, 10) || 0)

    const sql = `
        SELECT
                u.id,
                u.name,
                u.company,
                u.bio,
                u.analyst_verified,
                u.picture
            FROM user_follows uf
            JOIN users u
                ON u.id = uf.followed_id
            WHERE uf.follower_id = ?
            LIMIT ?
            OFFSET ?
        `

    const [rows] = await db.query(sql, [
        id,
        parsedLimit + 1,
        parsedOffset
    ])

    const hasNext = rows.length > parsedLimit;

    if (hasNext) rows.pop()

    return {
        results: rows,
        hasNext
    }
}

async function userFollowUser(user_id, followUser_id) {
    const db = getConnection()

    const sql = "INSERT INTO user_follows (follower_id, followed_id) VALUES (?, ?)"

    const [result] = await db.execute(sql, [user_id, followUser_id])

    return result
}

async function userUnfollowUser(user_id, followUser_id) {
    const db = getConnection()

    const sql = "DELETE FROM user_follows WHERE follower_id = ? AND followed_id = ?"

    const [result] = await db.execute(sql, [user_id, followUser_id])

    return result
}

async function isFollowing(user_id, followUser_id) {
    const db = getConnection()

    const sql = "SELECT 1 FROM user_follows WHERE follower_id = ? AND followed_id = ? LIMIT 1"
    const [rows] = await db.execute(sql, [user_id, followUser_id])

    // If rows.length > 0, the relationship exists, therefore true, otherwise false
    return rows.length > 0
}

export default { 
   
    getUsersPaginated, 
    getUsersById, 
    getUsersByEmail, 
    getUserWatchlist, 
    getUserWatchlistPaginated,
    createUsers, 
    updateUsers, 
    deleteUsers, 
    getAllAnalysts,
    getAnalystsByType,
    getAnalystById,
    getPendingAnalysts,
    userFollowAsset, 
    userUnfollowAsset,
    getFollowedUsers,
    userFollowUser,
    userUnfollowUser,
    isFollowing
}