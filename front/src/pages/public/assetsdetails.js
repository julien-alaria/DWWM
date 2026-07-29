import { API_BASE_URL } from "../../config/api.js"
import { getStock, getForex, getCommodities } from "../../utils/assetsUtils.js"
import { loadTradingViewChart } from "../../utils/tradingChart.js"
import http from "../../config/instanceHttp.js"
import { decodeToken } from "../../middlewares/roleGuard.js"
import { formatChartId, formatMarketCap, formatDate, escapeHtml } from "../../utils/format.js"
import analystCard from "../../components/cards/analystCard.js"
import recoForm from "../../components/forms/recoForm.js"
import { enableCarouselWindow } from "../../utils/lazyloading.js"
import { formatAssetImage } from "../../utils/imageHelper.js"
import { createPaginationList } from "../../components/pagination/paginationComponent.js"
import { getRecommendationIcon } from "../../utils/recommendationUtils.js"

// =====================
// HTML TEMPLATE 
// =====================
const detailsPage = `
    <section id="detail-section">
        <div id="asset-detail"></div> 
    </section>

    <section id="recomendations-section" class="hidden">
        <div id="recommendation-target"></div>
        <div id="recommendation-form"></div>
    </section>

    <section id="analyst-carousel-section">
        <div id="analyst-carousel-container" class="hidden">
            <h2 id="analyst-carousel-title">Analysts covering this asset</h2>
            <div class="carousel analyst-carousel"></div>
        </div>
    </section>

    <section id="analyst-list-global">
        <h2 id="analyst-list-title">All Related Analysts</h2>
        <div id="analyst-list-target"></div>
    </section>
`

export default detailsPage

// =====================
// STATE GLOBAL
// =====================
let recommendationsPaginator
let analystPaginator

// =====================
// INIT
// =====================
export async function initDetail() {
    try {
        const hash = window.location.hash
        const queryIndex = hash.indexOf("?")
        const query = queryIndex !== -1 ? hash.substring(queryIndex + 1) : ""
        const params = new URLSearchParams(query)
        const ticker = params.get("ticker")

        if (!ticker) {
            document.getElementById("asset-detail").innerHTML = "<p>Missing ticker</p>"
            return
        }

        // =====================
        // CENTRALIZED DATA RECOVERY
        // =====================
        const [stocks, forex, commodities] = await Promise.all([
            getStock(), getForex(), getCommodities()
        ])

        const allAssets = [...stocks, ...forex, ...commodities]
        const asset = allAssets.find(item =>
            String(item.ticker ?? "").trim().toUpperCase() === String(ticker).trim().toUpperCase()
        )

        if (!asset) {
            document.getElementById("asset-detail").innerHTML = "<p>Asset not found</p>"
            return
        }

        // Security expectation related to asynchronous router injection
        await new Promise((resolve) => setTimeout(resolve, 0))

        // =====================
        // STANDARDIZATION OF IMAGE & LOGO LOGIC
        // =====================
        const finalImage = formatAssetImage(asset.ticker)
        const fallbackImage = "/assets/nasdaq_logo.webp"

        // =====================
        // USER & WATCHLIST 
        // =====================

        // Access Token Security Checks
        const token = localStorage.getItem("token")
        const user = token ? decodeToken(token) : null

        const watchRes = user ? await http.get(`/users/me/watchlist`) : { result: [] }
        const isFollowed = watchRes.result?.some(w => w.ticker === asset.ticker)

        // =====================
        // PAGE HEADER RENDERING WITH LOGO
        // =====================
        const chartId = formatChartId(asset.ticker)
        document.getElementById("asset-detail").innerHTML = `
            <button onclick="history.back()" class="btn-back">Back</button>
            
            <div class="asset-header">
                <div class="asset-title-container">
                
                    <div class="asset-text-container">
                        <h1 class="asset-name">${asset.name}</h1>
                        <span class="asset-ticker">${asset.ticker}</span>
                    </div>
                    <div id="asset-title-image">
                        <img class="asset-logo" src="${finalImage}" alt="${asset.ticker}" onerror="this.onerror=null; this.src='${fallbackImage}';">
                    </div>
                </div>
            </div>
            
            <button id="follow-toggle-btn" class="detail-btn" data-ticker="${asset.ticker}" data-followed="${isFollowed}">
                <span class="follow-icon">${isFollowed ? "×" : "+"}</span>
                <span class="follow-text">${isFollowed ? "Remove" : "Track Asset"}</span>
            </button>
            
            <div class="asset-info">
                <div>PRICE: ${asset.price ?? "N/A"}</div>
                <div>MARKET CAP: ${asset.marketCap ? asset.marketCap : "N/A"}</div>
                <div>HIGH: ${asset.high ?? "N/A"}</div>
                <div>LOW: ${asset.low ?? "N/A"}</div>
            </div>
            
            <div id="${chartId}"></div>
        `

        // =====================
        // FOLLOW EVENT LISTENER
        // =====================
        const followBtn = document.getElementById("follow-toggle-btn")
        followBtn.addEventListener("click", async () => {
            const currentStatus = followBtn.dataset.followed === "true"
            const ticker = followBtn.dataset.ticker
            followBtn.disabled = true
            try {
                if (currentStatus) {
                    await http.delete(`/users/me/follows/${ticker}`)
                    followBtn.dataset.followed = "false"
                    followBtn.textContent = "Follow"
                } else {
                    await http.post("/users/me/follows", { ticker })
                    followBtn.dataset.followed = "true"
                    followBtn.textContent = "Unfollow"
                }
            } catch (err) {
                console.error("Follow error:", err)
            } finally {
                followBtn.disabled = false
            }
        })

        // =====================
        // CHARTS
        // =====================
        loadTradingViewChart(asset.ticker, asset.history)

        // =====================
        // RECOMMENDATION PAGINATION
        // =====================
        try {
            recommendationsPaginator = createPaginationList({
                targetSelector: "#recommendation-target",
                prefix: "reco",
                endpoint: `/recommendations?ticker=${asset.ticker}`,
                limit: 3,
                itemTemplate: (rec) => {
                    const defaultAvatar = "/assets/analyst/default_analyst.png"
                    const imageUrl = rec.analyst_picture ? `${API_BASE_URL}/uploads/${rec.analyst_picture}` : defaultAvatar
                    const recoImage = getRecommendationIcon(rec.status)

                    return `
                        <div class="recommendation" data-js-clickable data-analyst-id="${rec.user_id}">
                            <img class="reco-image" src="${recoImage}" alt="reco-image" />
                            <strong class="reco-status">${rec.status}</strong>
                            <img src="${imageUrl}" class="analyst-picture" alt="analyst-picture" onerror="this.src='${defaultAvatar}'" />
                            <p class="reco-name"><b>${rec.analyst_name ?? "unknown"}</b></p>
                            <p class="reco-comment">${escapeHtml(rec.comment)}</p>
                            <p class="reco-publish">Published on ${formatDate(rec.created_at)}</p>
                        </div>
                    `
                },
                buildUrl: (dataset) => `#/analystdetails?id=${dataset.analystId}`
            })

            await recommendationsPaginator.load()

        } catch (err) {
            console.error("Error loading recommendations:", err)
            const targetDiv = document.getElementById("recommendation-target")
            if (targetDiv) targetDiv.innerHTML = "<p>Error loading recommendations</p>"
        }
        
        // =====================
        // ANALYSTS CARROUSEL
        // =====================
        const dbAsset = await http.get(`/assets/details/${ticker}`)

        try {
            const analystRes = await http.get(`/users/analysts/by-type?type_id=${dbAsset.asset_type_id}`)
            const analysts = analystRes.results

            if (analysts && analysts.length > 0) {
                document.getElementById("analyst-carousel-container").classList.remove("hidden")
                
                enableCarouselWindow({
                    selector: ".analyst-carousel",
                    batchSize: analysts.length < 3 ? analysts.length : 3,
                    getData: () => analysts,
                    cardComponent: analystCard
                })

                document.querySelector(".analyst-carousel").addEventListener("click", (e) => {
                    const card = e.target.closest(".analyst")
                    if (card) {
                        const analystId = card.dataset.id
                        window.location.hash = `#/analystdetails?id=${analystId}`
                    }
                })
            }
        } catch (e) {
            console.error("Unable to load analysts:", e)
        }

        // =====================
        // ANALYST LIST PAGINATION
        // =====================
        analystPaginator = createPaginationList({
            targetSelector: "#analyst-list-target",
            prefix: "analyst",
            endpoint: `/users/analysts/by-type?type_id=${dbAsset.asset_type_id}`,
            limit: 3,
            itemTemplate: (a) => {
                const defaultAvatar = "/assets/analyst/default_analyst.png"
                const imageUrl = a.picture ? `${API_BASE_URL}/uploads/${a.picture}` : defaultAvatar

                return `
                    <div class="analyst-item" data-js-clickable data-id="${a.id}">
                        <img src="${imageUrl}" class="analyst-picture" alt="analyst-picture" onerror="this.src='${defaultAvatar}'" />
                        <p><strong>${escapeHtml(a.name)}</strong> - ${escapeHtml(a.company)}</p>
                    </div>
                `
            },
            buildUrl: (dataset) => `#/analystdetails?id=${dataset.id}`
        })

        await analystPaginator.load()

        // =====================
        // RECOMMENDATION FORM
        // =====================
        const canRecommend = user && (user.role === "admin" || (user.role === "analyst" && user.analyst_type_id === dbAsset.asset_type_id))
        const formContainer = document.getElementById("recommendation-form")
        
        if (canRecommend) {
            formContainer.innerHTML = recoForm()
            const recForm = document.getElementById("rec-form")
            if (recForm) {
                recForm.addEventListener("submit", async (e) => {
                    e.preventDefault()

                    const messageDiv = document.getElementById("message")
                    messageDiv.innerText = "Processing..."
                    const data = new FormData(e.target)

                    try {
                        await http.post("/recommendations", {
                            status: data.get("status"),
                            comment: data.get("comment"),
                            ticker: asset.ticker
                        })
                        messageDiv.innerText = "Recommendation successful"
                        setTimeout(async () => { await initDetail() }, 1000)
                        
                    } catch (err) {
                        messageDiv.innerText = err.response?.data?.message || "Recommendation error."
                    }
                })
            }
        // =====================
        // DISPLAY GESTION
        // =====================
        } else if (user) {
            formContainer.innerHTML = `<p>${user.role === "analyst" ? "Your specialization does not allow you to recommend this asset." : "Only analysts can post."}</p>`
        } else {
            formContainer.innerHTML = `<div class=login-message>
            <p><strong>Want to post a recommendation?</strong></p>
            <button class="detail-btn" id="login-btn" onclick="window.location.hash='#/login'">Log In as Analyst</button>
            </div>`
        }

    } catch (error) {
        console.error("DETAILS INIT ERROR:", error)
    }
}