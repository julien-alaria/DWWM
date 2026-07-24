import { API_BASE_URL } from "../../config/api.js"
import { escapeHtml } from "../../utils/format.js"

export default function analystCard({ id, name, company, bio, picture } = {}) {
    
    const defaultAvatar = "/assets/analyst/default_analyst.png"
    const imageUrl = picture ? `${API_BASE_URL}/uploads/${picture}` : defaultAvatar

    // Avoid visibles NULL
    const displayName = escapeHtml(name ?? "Analyst")
    const displayCompany = escapeHtml(company ?? "Independent Analyst")
    const displayBio = bio ? escapeHtml(bio.substring(0, 50)) + '...' : 'No bio available.'

    return `
        <div class="card analyst" data-id="${id ?? ''}">

            <img class="card-analyst-image" src="${imageUrl}" alt="${displayName}" onerror="this.onerror=null; this.src='/assets/analyst/default_analyst.png'">

            <h3 class="card-analyst-title">${displayName}</h3>

            <p class="card-analyst-company">${displayCompany}</p>

            <p class="card-analyst-bio">${displayBio}</p>

        </div>
    `
}
                                                                                                                                                        