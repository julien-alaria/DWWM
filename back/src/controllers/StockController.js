import stockService from "../services/stockService.js"

async function getStock(req, res, next) {
    try {
        const response = await stockService.getAAPLStock()

        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}

async function getAllStocks(req, res, next) {
    try {
        const response = await stockService.getMultipleAggregatesJson()
        
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}

async function getForex(req, res, next) {
    try {
        const response = await stockService.aggregateForexJson()
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}

async function getCommodities(req, res, next) {
    try {
        const response = await stockService.aggregateMetalsJson()
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}

// Light datas for Home.js
async function getHomeStocks(req, res, next) {
    try {
        const response = await stockService.getMultipleAggregatesJsonLight()
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}
// Light datas for Home.js
async function getHomeForex(req, res, next) {
    try {
        const response = await stockService.aggregateForexJsonLight()
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}
// Light datas for Home.js
async function getHomeCommodities(req, res, next) {
    try {
        const response = await stockService.aggregateMetalsJsonLight()
        res.status(200).json({ message: response })
    } catch (error) {
        next(error)
    }
}

// AGGREGATES FOR LIST.JS
export async function getCombinedBriefAssets(req, res, next) {
    try {
        const limit = Math.max(1, Number.parseInt(req.query.limit ?? 10, 10))
        const offset = Math.max(0, Number.parseInt(req.query.offset ?? 0, 10))

        const [stocks, forex, commodities] = await Promise.all([
                stockService.getBriefStocksJson(),
                stockService.getBriefForexJson(),
                stockService.getBriefCommoditiesJson()
            ])
            
            const allAssets = [...stocks, ...forex, ...commodities]

            allAssets.sort((a, b) =>
                (a.name ?? "").localeCompare(b.name ?? "", "fr", { sensitivity: "base" })
            )
            
            const results = allAssets.slice(offset, offset + limit + 1)
            
            const hasNext = results.length > limit
            
            if (hasNext) {
                results.pop()
            }
            
            return res.status(200).json({
                results,
                hasNext
            })
    } catch (error) {
        next(error)
    }
}

export default { 
    getStock, 
    getAllStocks, 
    getForex, 
    getCommodities,
    getHomeStocks,
    getHomeForex,
    getHomeCommodities,
    getCombinedBriefAssets
}
