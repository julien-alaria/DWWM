import { createPaginationList } from "../../components/pagination/paginationComponent.js"
import { formatAssetImage } from "../../utils/imageHelper.js"

// =====================
// HTML TEMPLATE 
// =====================
const list = `
    <h1 id="all-assetsh" >All Assets List</h1>
    <div id="assets-list-target"></div>
`

export default list

// =====================
// STATE GLOBAL
// =====================
let listPaginator

// =====================
// INIT
// =====================
export async function initList() {
    // =====================
    // LIST PAGINATION
    // =====================
    try {
        listPaginator = createPaginationList({
            targetSelector: "#assets-list-target",
            prefix: "assets",
            endpoint: "/assets/brief/all", 
            limit: 15,
            itemTemplate: (item) => {
                const finalImage = formatAssetImage(item.ticker)
                return `
                    <div class="asset-item" data-js-clickable data-ticker="${item.ticker}" data-type="${item.type}">
                        <img src="${finalImage}" alt="${item.name} logo" 
                             onerror="this.onerror=null; this.src='/assets/nasdaq_logo.webp';">
                        <span><strong>${item.ticker}</strong></span>
                        <span>${item.name}</span>
                    </div>
                `
            },
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        await listPaginator.load()

    } catch (err) {
        console.error("LIST INIT ERROR:", err)
        document.getElementById("assets-list-target").innerHTML = "<p>Failed to load assets.</p>"
    }
}