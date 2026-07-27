import AssetModel from "../models/AssetModel.js"
import AppError from "../utils/AppError.js"

async function getAssetDetails(req, res, next) {
    try {
        const { ticker } = req.params

        const asset = await AssetModel.getAssetByTicker(ticker)

        if (!asset) {
            throw new AppError("Asset not found in database", 404)
        }

        return res.status(200).json(asset)
    } catch (error) {
        next(error)
    }
}

export default getAssetDetails