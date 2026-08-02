import { API_BASE_URL } from "../../config/api.js"
import http from "../../config/instanceHttp.js"
import { formatDate, escapeHtml } from "../../utils/format.js"
import { decodeToken } from "../../middlewares/roleGuard.js"
import { createPaginationList } from "../../components/pagination/paginationComponent.js"
import { getRecommendationIcon } from "../../utils/recommendationUtils.js"

// =====================
// HTML TEMPLATE 
// =====================
const analystDetailsPage = `
    <section>
        <div id="analyst-detail"></div>
    </section>

    <section id="analyst-recommendation">
        <h2 id="analyst-reco-t">This Analyst Recommendations</h2>
        <div id="analyst-recommendation-target"></div>
    </section>
`

export default analystDetailsPage

// =====================
// STATE GLOBAL
// =====================
let recommendationsPaginator = null

// =====================
// INIT
// =====================
export async function initAnalystDetail() {
    try {
        const params = new URLSearchParams(window.location.hash.split("?")[1])
        const analystId = params.get("id")

        if (!analystId) {
            console.error("No analyst ID found")
            return
        }
        // Access Token Security Checks
        const currentUser = decodeToken(localStorage.getItem("token"))

        // =====================
        // DATA RECOVERY
        // =====================
        const response = await http.get(`/users/analysts/${analystId}`)
        const analyst = response.results

        // Security expectation related to asynchronous router injection
        await new Promise(resolve => setTimeout(resolve, 0))

        if (currentUser) {
            const checkFollow = await http.get(`/users/me/follows/users/${analystId}/check`)
            analyst.isFollowing = checkFollow.isFollowing // Injecte true or false in object
        } else {
            analyst.isFollowing = false
        }

        renderAnalyst(analyst, currentUser)

        // =====================
        // PAGINATION RENDERING
        // =====================

        // RECOMMANDATIONS PAGINATOR
        recommendationsPaginator = createPaginationList({
            targetSelector: "#analyst-recommendation-target",
            prefix: "analyst-reco",
            endpoint: `/recommendations/analyst/${analystId}`,
            limit: 3,
            itemTemplate: (rec) => {
                const defaultAvatar = "/assets/logos/nasdaq_logo.png"
                const imageUrl = rec.ticker ? `/assets/logos/${rec.ticker.toLowerCase()}.svg` : defaultAvatar

                const recoImage = getRecommendationIcon(rec.status)

                return `
                    <div class="analyst-recommendation" data-js-clickable data-ticker="${rec.ticker}" data-type="asset">
                        <img class="reco-image" src="${recoImage}" alt="reco-image" />
                        <strong>${rec.status}</strong>
                        <img src="${imageUrl}" class="reco-analyst-pic" alt="analyst-picture" onerror="this.src='${defaultAvatar}'" />
                        <p class="reco-company">${rec.name}</p>
                        <p class="reco-comment">${escapeHtml(rec.comment)}</p>
                        <p class="reco-date"><small>${formatDate(rec.created_at)}</small></p>
                    </div>
                `
            },
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        await recommendationsPaginator.load()

    } catch (err) {
        console.error("Analyst Detail Error:", err)
    }
}

// =====================
// RENDER ANALYST HEADER
// =====================
function renderAnalyst(analyst, currentUser) {
    const container = document.getElementById("analyst-detail")
    if (!container) return

    const isSelf = currentUser && Number(currentUser.id) === Number(analyst.id)
    
    const initialText = analyst.isFollowing ? "Unfollow" : "Follow"

    const defaultAvatar = "/assets/analyst/default_analyst.png"
    const imageUrl = analyst.picture ? `${API_BASE_URL}/uploads/${analyst.picture}` : defaultAvatar

    container.innerHTML = `
        <button id="back-btn" class="btn-back">Back</button>

        <div class="asset-header">
            <div class="analyst-avatar-container">
                <img src="${imageUrl}" alt="Photo de ${analyst.name}" class="analyst-profile-pic" />
            </div>
            
            <h1 id="analyst-name">${analyst.name}</h1>
            <p id="analyst-co">Company: ${escapeHtml(analyst.company)}</p>
            <p id="analyst-bio">Biographie: ${escapeHtml(analyst.bio)}</p>

            <button id="follow-btn" ${isSelf ? "disabled" : ""} data-followed="${analyst.isFollowing}">
                ${isSelf ? "Your Profile" : initialText}
            </button>
        </div>
    `

    document.getElementById("back-btn")
        .addEventListener("click", () => history.back())

     if (!currentUser) {
        document.getElementById("follow-btn")?.remove()
    } else if (!isSelf) {
        bindFollowButton(analyst.id)
    }
}

// =====================
// FOLLOW LOGIC
// =====================
function bindFollowButton(analystId) {
    const btn = document.getElementById("follow-btn")
    if (!btn) return

    btn.addEventListener("click", async () => {
        const isFollowing = btn.dataset.followed === "true"
        btn.disabled = true

        try {
            if (isFollowing) {
                await http.delete(`/users/me/follows/users/${analystId}`)
                btn.dataset.followed = "false"
                btn.textContent = "Follow Analyst"
            } else {
                await http.post(`/users/me/follows/users/${analystId}`)
                btn.dataset.followed = "true"
                btn.textContent = "Unfollow Analyst"
            }
        } catch (err) {
            console.error("Follow/Unfollow error:", err)
        } finally {
            btn.disabled = false
        }
    })
}