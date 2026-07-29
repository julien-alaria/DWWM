import getConnection from "../db/connection.js"
import AppError from "../utils/AppError.js"

async function getMyRecommendationsPaginated(userId, limit = 2, offset = 0){
    const db = getConnection()

    const parsedLimit = Math.max(1, Number.parseInt(limit ?? 2, 10))
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? 0, 10))

    const sql = `
        SELECT r.id, r.status, r.comment, r.created_at, r.asset_id, r.user_id, a.ticker, a.name, u.name, u.picture
        FROM recommendations r
        JOIN assets a ON a.id = r.asset_id
        JOIN users u on u.id = r.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `
    // Incompatible binary protocol in method .execute() on Windows OS, resolved by switching to textual protocol via .query()
    const [rows] = await db.query(sql, [userId, parsedLimit, parsedOffset])

    return rows
}

async function getAllRecommendationsPaginated(limit = 2, offset = 0) {
    const db = getConnection()

    const parsedLimit = Math.max(1, Number.parseInt(limit ?? 2, 10))
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? 0, 10))

    const sql = `
        SELECT 
            r.id,
            r.status,
            r.comment,
            r.created_at,
            r.asset_id,
            r.user_id,
            a.ticker,
            a.name,
            u.name AS analyst_name
        FROM recommendations r
        JOIN assets a ON a.id = r.asset_id
        JOIN users u ON u.id = r.user_id
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `
    // Incompatible binary protocol in method .execute() on Windows OS, resolved by switching to textual protocol via .query()
    const [rows] = await db.query(sql, [parsedLimit, parsedOffset])

    return rows
}

async function getRecommendationsById(id) {
    const db = getConnection()

    const sql = `
        SELECT 
            r.id,
            r.status,
            r.comment,
            r.asset_id,
            r.user_id,
            u.name AS analyst_name
        FROM recommendations r
        JOIN users u ON u.id = r.user_id
        WHERE r.id = ?
    `

    const [result] = await db.execute(sql, [id])

    return result[0] || null
}

async function getRecommendationsByAssetId(assetId, limit = 2, offset = 0) {
    const db = getConnection()

    const parsedLimit = Math.max(1, Number.parseInt(limit ?? 2, 10))
    const parsedOffset = Math.max(0, Number.parseInt(offset ?? 0, 10))

    const sql = `
        SELECT 
            r.id,
            r.status,
            r.comment,
            r.asset_id,
            r.user_id,
            r.created_at,
            u.name AS analyst_name,
            u.picture as analyst_picture
        FROM recommendations r
        JOIN users u ON u.id = r.user_id
        WHERE r.asset_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `

    // Incompatible binary protocol in method .execute() on Windows OS, resolved by switching to textual protocol via .query()
    const [rows] = await db.query(sql, [assetId, parsedLimit, parsedOffset])
    return rows
}

async function getRecommendationsByAssetIdPaginated(assetId, limit, offset) {
    const db = getConnection();
    const sql = `
        SELECT r.id, r.status, r.comment, r.created_at, r.asset_id, r.user_id, u.name AS analyst_name
        FROM recommendations r
        JOIN users u ON u.id = r.user_id
        WHERE r.asset_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `
    // Incompatible binary protocol in method .execute() on Windows OS, resolved by switching to textual protocol via .query()
    const [rows] = await db.query(sql, [assetId, Number(limit), Number(offset)]);
    return rows;
}


async function createRecommendations(data) {
    const db = getConnection()

    const { status, comment, asset_id, user_id } = data

    const sql = "INSERT INTO recommendations (status, comment, asset_id, user_id) VALUES (?, ?, ?, ?)"

    const [result] = await db.execute(sql, [status, comment, asset_id, user_id])

    return {
        id: result.insertId,
        status,
        comment,
        asset_id,
        user_id
    }
}

async function updateRecommendations(id, data){
      const db = getConnection()

    const fields = []
    const values = []

    if (data.status !== undefined) {
        fields.push("status = ?")
        values.push(data.status)
    }

    if (data.comment !== undefined) {
        fields.push("comment = ?")
        values.push(data.comment)
    }

    if (fields.length === 0) {
        throw new AppError("No fields to update")
    }

    values.push(id)

    const sql = `UPDATE recommendations SET ${fields.join(", ")} WHERE id = ?`

    const [result] = await db.execute(sql, values)

    if (result.affectedRows === 0) {
        throw new AppError("Recommendation not found")
    }

    return result
}

async function deleteRecommendations(id){
    const db = getConnection()

    if (!Number.isInteger(Number(id))) {
        throw new AppError("Invalid ID")
    }

    const sql = 'DELETE FROM recommendations WHERE id = ?'

    const [result] = await db.execute(sql, [id])

    if (result.affectedRows === 0) {
        throw new AppError("Recommendation not found")
    }

    return result

}

async function getByAnalystId(analystId, limit, offset) {
    const db = getConnection();
    const sql = `
        SELECT r.*, a.ticker, a.name, u.name AS analyst_name
        FROM recommendations r
        JOIN assets a ON a.id = r.asset_id
        JOIN users u ON u.id = r.user_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?
    `
    const [rows] = await db.query(sql, [analystId, limit, offset]);
    return rows;
}

export default { 
    getAllRecommendationsPaginated, 
    getMyRecommendationsPaginated, 
    getRecommendationsById, 
    getRecommendationsByAssetId, 
    getRecommendationsByAssetIdPaginated, 
    createRecommendations, 
    updateRecommendations, 
    deleteRecommendations,
    getByAnalystId
}

