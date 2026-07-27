import RecommendationModel from "../models/RecommendationModel.js"
import AssetModel from "../models/AssetModel.js"
import { sanitizeRecommendation, sanitizeRecommendationUpdate } from "../utils/sanitizer.js"
import AppError from "../utils/AppError.js"

// GET
async function getRecommendationPagin(req, res, next) {
    try {
        const { ticker } = req.query

        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 2, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        // FILTER BY ASSET (ticker)
        if (ticker) {
            const asset = await AssetModel.getAssetByTicker(ticker)
            if (!asset) throw new AppError("Asset not found", 404)

            const results = await RecommendationModel.getRecommendationsByAssetId(asset.id, limit, offset)

            const nextPage = await RecommendationModel.getRecommendationsByAssetIdPaginated(asset.id, limit, offset + limit);
            const hasNext = nextPage.length > 0;

            return res.status(200).json({ results, hasNext })
        }

        const results = await RecommendationModel.getAllRecommendationsPaginated(limit, offset)

        const nextPage = await RecommendationModel.getAllRecommendationsPaginated(limit, offset + Number(limit))

        const hasNext = nextPage.length > 0

        return res.status(200).json({ results, hasNext })

    } catch (error) {
        next(error)
    }
}

async function getMyRecommendation(req, res, next) {
    try {
        const userId = req.user.id
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const results = await RecommendationModel.getMyRecommendationsPaginated(userId, limit + 1, offset)
        
        const hasNext = results.length > limit
        
        if (hasNext) {
            results.pop()
        }

        return res.status(200).json({ results, hasNext })
    } catch (error) {
        next(error)
    }
}

// POST
async function createRecommendation(req, res, next) {
    try {
        if (!req.asset) {
            throw new AppError("Asset not resolved", 400)
        }

        if (req.user.role === "analyst" && Number(req.user.analyst_verified) !== 1) {
            throw new AppError("Your analyst account is pending validation. You cannot publish any recommendations.", 403)
        }

        if (req.user.role === "analyst" && req.user.analyst_type_id !== req.asset.asset_type_id) {
            throw new AppError("You are not authorized to post on this type of asset.", 403)
        }

        const sanitizedData = sanitizeRecommendation({
            status: req.body.status,
            comment: req.body.comment,
            asset_id: req.asset.id
        })

        const recommendation =
            await RecommendationModel.createRecommendations({
                ...sanitizedData,
                user_id: req.user.id
            })

        return res.status(201).json({ recommendation })

    } catch (error) {
        next(error)
    }
}

// PUT /recommendations/:id
async function updateRecommendation(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid ID", 400)
        }

        const sanitizedData = sanitizeRecommendationUpdate(req.body)

        if (Object.keys(sanitizedData).length === 0) {
            throw new AppError("Invalid data", 400)
        }

        const existing = await RecommendationModel.getRecommendationsById(id)

        if (!existing) {
            throw new AppError("Recommendation not found", 404)
        }

        // AUTHORIZATION
        if (req.user.role !== "admin" && existing.user_id !== req.user.id) {
            throw new AppError("Update denied", 403)

        }

        const recommendation = await RecommendationModel.updateRecommendations(id, sanitizedData)

        return res.status(200).json({ recommendation })

    } catch (error) {
        next(error)
    }
}

// DELETE /recommendations/:id
async function deleteRecommendation(req, res, next) {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            throw new AppError("Invalid ID", 400)
        }

        const existing = await RecommendationModel.getRecommendationsById(id)

        if (!existing) {
            throw new AppError("Recommendation not found", 404)
        }

        // AUTHORIZATION
        if (req.user.role !== "admin" && existing.user_id !== req.user.id) {
            throw new AppError("Delete denied", 403)
        }

        await RecommendationModel.deleteRecommendations(id)

        return res.status(200).json({ message: "delete ok" })

    } catch (error) {
        next(error)
    }
}

async function getRecommendationsByAnalyst(req, res, next) {
    try {
        const { analystId } = req.params;
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10));
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10));

        const results = await RecommendationModel.getByAnalystId(analystId, limit, offset);
        
        const nextResults = await RecommendationModel.getByAnalystId(analystId, limit, offset + limit);
        const hasNext = nextResults.length > 0;

        return res.status(200).json({ results, hasNext });
    } catch (error) {
        next(error);
    }
}

export default { 
    getRecommendationPagin, 
    getMyRecommendation, 
    createRecommendation, 
    updateRecommendation, 
    deleteRecommendation,
    getRecommendationsByAnalyst
}