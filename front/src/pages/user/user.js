import { API_BASE_URL } from "../../config/api.js"
import http from "../../config/instanceHttp.js"
import { decodeToken } from "../../middlewares/roleGuard.js"
import stockCard from "../../components/cards/stockCards.js"
import analystCard from "../../components/cards/analystCard.js"
import { getStock, getForex, getCommodities } from "../../utils/assetsUtils.js"
import updateForm from "../../components/forms/userUpdateForm.js"
import { initDeleteAccount } from "../../utils/deleteAccountUtils.js"
import { createCarousel } from "../../components/carousel/carouselComponent.js"
import { createPaginationList } from "../../components/pagination/paginationComponent.js"
import { buildWatchlistData } from "../../utils/assetFormatter.js"
import { escapeHtml } from "../../utils/format.js"

// =====================
// HTML TEMPLATE
// =====================
const userPage = `
    <h1 id="userh">My User Page</h1>

    <section>
        <div><img id="user_picture" src="" /></div>
        <div id="user_name"></div>
        <div id="user_email"></div>
    </section>

    <section>
        <h2>My Watchlist</h2>
        <div id="watchlist-carousel-target"></div>

        <div id="watchlist-list-global">
            <h2>Watchlist By List</h2>
            <div id="watchlist-list-target"></div>
        </div>
    </section>

    <section>
        <h2>Followed Analysts</h2>
        <div id="follow-carousel-target"></div>

        <div id="follow-list-global">
            <h2>Followed Analysts By List</h2>
            <div id="follow-list-target"></div>
        </div>
    </section>

    <section>
        <div class="update-form">
            ${updateForm()}
            <div id="update-message"></div>
        </div>
    </section>

    <section class="danger-zone">
        <h2>Danger Zone</h2>
        <p>Deleting your account is permanent: your watchlist, subscriptions, and personal data will be deleted.</p>
        <button type="button" id="delete-account-btn" class="danger-btn">Delete my account</button>
    </section>

`

export default userPage

// =====================
// STATE GLOBAL
// =====================
let watchlistPaginator = null
let followPaginator = null

// =====================
// INIT
// =====================
export async function initUser() {
    try {
        // Access Token Security Checks
        const token = localStorage.getItem("token")
        if (!token) return

        const payload = decodeToken(token)
        if (!payload) {
            window.location.hash = "/login"
            return;
        }

        // =====================
        // CENTRAL DATA RECOVERY
        // =====================
        const [userRes, watchRes, followRes, stocks, forex, commodities] = await Promise.all([
            http.get("/users/me"),
            http.get("/users/me/watchlist"),
            http.get("/users/me/follows/users"),
            getStock(),
            getForex(),
            getCommodities()
        ]);

        const user = userRes.result
        renderUserInfo(user)

        const allAssets = [...stocks, ...forex, ...commodities]
        const watchlist = buildWatchlistData(watchRes.result, allAssets)
        const followState = followRes.results || []

        // security waiting before DOM injection
        await new Promise(resolve => setTimeout(resolve, 0))

        // =====================
        // CAROUSSELS RENDERING
        // =====================
        const renderWatchlistCarousel = (currentData) => {
            createCarousel({
                targetSelector: "#watchlist-carousel-target",
                carouselId: "watchlist-carousel",
                data: watchlist,
                cardComponent: stockCard,
                buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
            })
        }
        renderWatchlistCarousel(watchlist)

        createCarousel({
            targetSelector: "#follow-carousel-target",
            carouselId: "follow-carousel",
            data: followState,
            cardComponent: analystCard,
            buildUrl: (dataset) => `#/analystdetails?id=${dataset.id}`
        })

        // =====================
        // PAGINATION RENDERING
        // =====================

        // WATCHLIST PAGINATOR
        watchlistPaginator = createPaginationList({
            targetSelector: "#watchlist-list-target",
            prefix: "watchlist",
            endpoint: "/users/me/watchlist-paginated",
            itemTemplate: (item) => {
                const defaultLogo = "/assets/logos/nasdaq_logo.png"
                const logoUrl = item.ticker ? `/assets/logos/${item.ticker.toLowerCase()}.svg` : defaultLogo

                return `
                    <div class="watchlist-item" data-js-clickable data-ticker="${item.ticker}" data-type="${item.asset_type_id || item.type}">
                        <img src="${logoUrl}" alt="asset-logo" onerror="this.src='${defaultLogo}'" />
                        <p><strong>${item.ticker}</strong> - ${item.name}</p>
                    </div>
                `
            },
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        // FOLLOW PAGINATOR
        followPaginator = createPaginationList({
            targetSelector: "#follow-list-target",
            prefix: "follow",
            endpoint: "/users/me/follows/users",
            itemTemplate: (a) => {
                const defaultAvatar = "/assets/analyst/default_analyst.png";
                const avatarUrl = a.picture ? `${API_BASE_URL}/uploads/${a.picture}` : defaultAvatar

                return `
                    <div class="follow-item" data-js-clickable data-id="${a.id}">
                        <img src="${avatarUrl}" alt="analyst-avatar" onerror="this.src='${defaultAvatar}'" />
                        <p><strong>${escapeHtml(a.name)}</strong> - ${escapeHtml(a.company ?? "Unknown")}</p>
                    </div>
                `
            },
            buildUrl: (dataset) => `#/analystdetails?id=${dataset.id}`
        })

        await watchlistPaginator.load()
        await followPaginator.load()

        initLocalUpdateForm(user)
        initDeleteAccount("This action is irreversible and will delete your watchlist and subscriptions. Do you confirm?")

    } catch (err) {
        console.error("USER INIT ERROR:", err)
    }
}

// =====================
// LOCAL FEATURES LOGIC FUNCTIONS
// =====================

// rendering local user infos
function renderUserInfo(user) {
    document.getElementById("user_name").textContent = `${user.name}`
    document.getElementById("user_email").textContent = `Email: ${user.email}`
    const imageEl = document.getElementById("user_picture")
    if (imageEl) {
        imageEl.src = user.picture ? `${API_BASE_URL}/uploads/${user.picture}` : "/assets/analyst/default_analyst.png"
    }
}

// update local form
function initLocalUpdateForm(user) {
    const form = document.getElementById("user-update-form")
    if (!form) return

    const nameInput = document.getElementById("user-name")
    const emailInput = document.getElementById("user-email")
    const passwordInput = document.getElementById("user-password")
    if (nameInput) nameInput.value = user.name ?? ""
    if (emailInput) emailInput.value = user.email ?? ""
    // browsers sometimes autofill this as a saved login password despite
    // autocomplete="new-password" — force it empty on load regardless
    if (passwordInput) passwordInput.value = ""

    form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const messageDiv = document.getElementById("update-message")
        if (messageDiv) messageDiv.innerText = ""

        const data = new FormData(form)
        if (!data.get("password")?.trim()) data.delete("password")

        try {
            const result = await http.put("/users/me", data)
            if (result?.token) localStorage.setItem("token", result.token)

            if (messageDiv) messageDiv.innerText = result?.message || "Profil mis à jour avec succès"

            setTimeout(() => window.location.reload(), 800)

        } catch (err) {
            if (messageDiv) messageDiv.innerText = err.response?.data?.message || "Échec de la mise à jour."
            console.error(err)
        }
    })
}

