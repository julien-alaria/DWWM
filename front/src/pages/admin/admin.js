import http from "../../config/instanceHttp.js"
import { decodeToken } from "../../middlewares/roleGuard.js"
import analystUpdateForm from "../../components/forms/analystUpdateForm.js"
import { createPaginationList } from "../../components/pagination/paginationComponent.js"
import { bindRecommendationActions } from "../../utils/actionManager.js"
import { escapeHtml } from "../../utils/format.js"

// =====================
// HTML TEMPLATE 
// =====================
const adminPage = `
    <h1>ADMIN PAGE</h1>

    <section>
        <div id="admin_name"></div>
        <div id="admin_id"></div>
        <div id="admin_email"></div>
    </section>

    <section>
        <h2>ANALYST VALIDATION</h2>
        <div id="pending-analysts"></div>
    </section>

    <section>
        <h2>All Recommendations</h2>
        <div id="adminreco-list-target"></div>
    </section>

    <section>
        <h2 id="admin-users-title">Gestion des Utilisateurs</h2>
        <div id="users-list-target"></div>
    </section>

    <section class="update-form">
        ${analystUpdateForm()}
        <div id="update-message"></div>
    </section>
`

export default adminPage

// =====================
// STATE GLOBAL
// =====================
let recommendationsPaginator = null
let usersPaginator = null

// =====================
// INIT
// =====================
export async function initAdmin() {
    try {
        // Access Token Security Checks
        const token = localStorage.getItem("token")
        if (!token) return

        const payload = decodeToken(token)
        if (!payload) {
            window.location.hash = "/login"
            return
        }

        // =====================
        // DATA RECOVERY
        // =====================
        const [userRes] = await Promise.all([
            http.get("/users/me")
        ])

        const user = userRes.result
        renderAdmin(user)

        // =====================
        // PAGINATION RENDERING
        // =====================

        // ALL RECOMMENDATIONS PAGINATOR
        recommendationsPaginator = createPaginationList({
            targetSelector: "#adminreco-list-target",
            prefix: "adminreco",
            endpoint: "/recommendations",
            itemTemplate: (rec) => {
                const isMine = Number(user.id) === Number(rec.user_id)

                return `
                <div class="admin-recommendation" data-id="${rec.id}">
                    <div class="reco-line1">
                        <strong>${rec.status}</strong>
                        <p class="reco-comment">${escapeHtml(rec.comment)}</p>

                        <div class="meta">
                            <span>Analyst: <strong>${rec.analyst_name}</strong></span>
                            ${isMine ? '<span class="badge">Me</span>' : ''}
                        </div>

                        <p class="reco-asset">Asset: ${rec.name} (${rec.ticker})</p>
                    </div>

                    <div class="reco-line2">
                        <button class="delete-btn" data-id="${rec.id}">
                            DELETE
                        </button>

                        <form class="edit-form hidden" data-id="${rec.id}">
                            <select name="status">
                                <option value="BUY" ${rec.status === "BUY" ? "selected" : ""}>BUY</option>
                                <option value="SELL" ${rec.status === "SELL" ? "selected" : ""}>SELL</option>
                                <option value="HOLD" ${rec.status === "HOLD" ? "selected" : ""}>HOLD</option>
                            </select>

                            <input name="comment" value="${escapeHtml(rec.comment)}" required />

                            <button type="submit">EDIT</button>
                        </form>
                    </div>
                </div>
                `
            },
            // No global redirection on click for admin
            buildUrl: () => "" 
        })

        // USERS LIST PAGINATOR
        usersPaginator = createPaginationList({
            targetSelector: "#users-list-target",
            prefix: "users",
            endpoint: "/users",
            itemTemplate: (u) => `
                <div class="user-item">
                    <span>${u.name} (${u.role})</span>
                    <button class="edit-user-btn" data-id="${u.id}">Éditer</button>
                    <button class="delete-user-btn" data-id="${u.id}">Delete</button>
                </div>
            `,
            buildUrl: () => ""
        })

        await usersPaginator.load()
        await recommendationsPaginator.load()
        await loadPendingAnalysts()

        // Linking local business event listeners
        bindRecommendationActions("#adminreco-list-target", recommendationsPaginator)
        bindUserListEvents()
        initForm(user)

    } catch (err) {
        console.error("ADMIN INIT ERROR:", err)
    }
}

// =====================
// RENDER ADMIN INFO
// =====================
function renderAdmin(user) {
    const map = {
        admin_id: user.id,
        admin_name: user.name,
        admin_email: user.email
    }

    Object.entries(map).forEach(([id, value]) => {
        const el = document.getElementById(id)
        if (el) el.textContent = value ?? "N/A"
    })
}

// =====================
// PENDING ANALYSTS
// =====================
async function loadPendingAnalysts() {
    const container = document.getElementById("pending-analysts")
    if (!container) return

    try {
        const res = await http.get("/users/pending-analysts")
        const pendingAnalysts = res.results

        if (!pendingAnalysts || pendingAnalysts.length === 0) {
            container.innerHTML = `<p class="no-data"> No analysts awaiting validation.</p>`
            return
        }

        container.innerHTML = `
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Entreprise</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingAnalysts.map(analyst => `
                        <tr>
                            <td><strong>${escapeHtml(analyst.name)}</strong></td>
                            <td>${analyst.email}</td>
                            <td>${escapeHtml(analyst.company) || "N/A"}</td>
                            <td>
                                <button class="approve-btn" data-id="${analyst.id}">
                                    Approve
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `

        container.querySelectorAll(".approve-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.target.dataset.id
                e.target.disabled = true

                try {
                    await http.put(`/users/${id}`, { analyst_verified: 1 })
                    alert("Analyst successfully approved")
                    await loadPendingAnalysts()
                    if (usersPaginator) await usersPaginator.load()
                } catch (err) {
                    console.error("APPROVE ANALYST ERROR:", err)
                    alert("Error during validation.")
                    e.target.disabled = false
                }
            })
        })

    } catch (err) {
        console.error("LOAD PENDING ANALYSTS ERROR:", err)
        container.innerHTML = `<p style="color: red;">Error loading requests.</p>`
    }
}

// =====================
// USER CLICK MANAGEMENT
// =====================
function bindUserListEvents() {
    const container = document.getElementById("users-list-target")
    if (!container) return

    container.addEventListener("click", async (e) => {
        // Click on Edit
        if (e.target.classList.contains("edit-user-btn")) {
            const id = e.target.dataset.id
            try {
                const res = await http.get(`/users/${id}`)
                const u = res.result

                document.getElementById("analyst-name").value = u.name
                document.getElementById("analyst-email").value = u.email
                document.getElementById("analyst-company").value = u.company || ""
                document.getElementById("analyst-bio").value = u.bio || "" 
                document.getElementById("target-user-id").value = u.id

                document.querySelector(".update-form").scrollIntoView({ behavior: "smooth" })
            } catch (err) {
                console.error("EDIT USER ERROR:", err)
            }
            return
        }

        // Click on Delete
        if (e.target.classList.contains("delete-user-btn")) {
            const id = e.target.dataset.id
            try {
                await http.delete(`/users/${id}`)
                await usersPaginator.load() // auto refesh
            } catch (err) {
                console.error("DELETE USER ERROR:", err)
            }
        }
    })
}

// =====================
// INIT FORM PROFILE
// =====================
function initForm(user) {
    const form = document.getElementById("analyst-update-form")
    if (!form) return

    // browsers sometimes autofill this as a saved login password despite
    // autocomplete="new-password" — force it empty on load regardless
    const passwordInput = document.getElementById("password")
    if (passwordInput) passwordInput.value = ""

    form.addEventListener("submit", async (e) => {
        e.preventDefault()

        const messageDiv = document.getElementById("update-message")
        if (messageDiv) messageDiv.innerText = ""

        const formData = new FormData(form)
        const targetId = formData.get("target_user_id")
        const url = targetId ? `/users/${targetId}` : "/users/me"

        const payload = new FormData()
        payload.append("name", formData.get("name"))
        payload.append("email", formData.get("email"))
        payload.append("company", formData.get("company") ?? "")
        payload.append("bio", formData.get("bio") ?? "")

        const password = formData.get("password")
        if (password) {
            payload.append("password", password)
        }

        const picture = formData.get("picture")
        if (picture && picture.size > 0) {
            payload.append("picture", picture)
        }

        try {
            const result = await http.put(url, payload)

            if (messageDiv) messageDiv.innerText = result?.message || "Profile updated"

            const passwordField = form.querySelector('[name="password"]')
            if (passwordField) passwordField.value = ""

            setTimeout(() => initAdmin(), 800)
        } catch (err) {
            console.error("UPDATE ERROR:", err)
            if (messageDiv) messageDiv.innerText = err.response?.data?.message || "Update failed."
        }
    })
}