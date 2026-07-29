import http from "../../config/instanceHttp.js"
import { getStock, getForex, getCommodities, getStockLight, getForexLight, getCommoditiesLight } from "../../utils/assetsUtils.js"
import stockCard from "../../components/cards/stockCards.js"
import forexCard from "../../components/cards/forexCards.js"
import commodityCard from "../../components/cards/commodityCards.js"
import analystCard from "../../components/cards/analystCard.js"
import { createCarousel } from "../../components/carousel/carouselComponent.js"
import { initGenericSearchBar } from "../../components/searchBar/searchBarUtils.js"
import { getAuthenticatedUser } from "../../middlewares/roleGuard.js"

// =====================
// HTML TEMPLATE 
// =====================
const home = `
    <section id="home-top">
        <h1 id="home-top-title">TRADER TRACKER</h1>
        <p id="home-top-text">Track your investments with ease</p>
        <a id="home-top-register" href="#/register">CREATE FREE ACCOUNT</a>
    </section>

    <section id="home-search-bar"> 
        <h2 id="search-bar-text">FIND YOUR ASSET</h2>
        <div id="search-container"></div>
    </section> 

    <section id="home-stocks">
        <h2 id="home-stocks-title">NASDAQ</h2>
        <p id="home-stocks-text">Nasdaq is a US stock market for new companies with high growth potential, particularly in the high-tech sector.</p>
        <div id="stocks-carousel-target"></div>
    </section>

    <section id="home-forex">
        <h2 id="home-forex-title">Forex</h2>
        <p id="home-forex-text">Foreign exchange market where currencies from all over the world are traded</p> 
        <div id="forex-carousel-target"></div>
    </section>

    <section id="home-middle">
        <p id="home-middle-text">Take control of your investments today</p>
        <a id="home-middle-register" href="#/register">CREATE FREE ACCOUNT</a>
    </section>

    <section id="home-commodities">
        <h2 id="home-commodities-title">Comex</h2>
        <p id="home-commodities-text">The largest exchange for metals futures contracts</p>
        <div id="commodities-carousel-target"></div>
    </section>

    <section id="home-analysts">
        <h2 id="home-analysts-title">Analysts</h2>
        <p id="home-analysts-text">Follow our expert analysts for commentary and buy/sell recommendations based on market trends.</p>
        <div id="analysts-carousel-target"></div>
    </section>

    <section id="home-allassets">
        <div id="home-allassets-link">
            <h2 id="home-allassets-link-title">All Assets</h2>
            <p id="home-allassets-text">Discover all our available financial assets.</p>
            <a href="#/list" class="btn" id="all-assets-btn">All Assets By List</a>
        </div>
    </section>
`

export default home

// =====================
// INIT
// =====================
export async function initHome() {
    try {
        // =====================
        // AUTH CHECK — hide CTA buttons if logged in
        // =====================
        const user = getAuthenticatedUser()
        if (user) {
            document.getElementById("home-top-register")?.remove()
            document.getElementById("home-middle-register")?.remove()
        }
        
        // =====================
        // CENTRAL DATA RECOVERY
        // =====================
        const [stocks, forex, commodities] = await Promise.all([
            getStockLight(),
            getForexLight(),
            getCommoditiesLight(),
        ])
        const allData = [...stocks, ...forex, ...commodities]

        const analystRes = await http.get("/users/analysts")
    
        // Security expectation related to asynchronous router injection
        await new Promise(resolve => setTimeout(resolve, 0))

        // =====================
        // SEARCH BAR
        // =====================
        initGenericSearchBar({
            targetSelector: "#search-container",
            data: allData,
            onSelect: (item) => {
                window.location.hash = `#/details?type=${item.type}&ticker=${item.ticker}`
            }
        })

        // =====================
        // CARROUSELS
        // =====================
        createCarousel({
            targetSelector: "#stocks-carousel-target",
            carouselId: "stocks",
            data: stocks,
            cardComponent: stockCard,
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        createCarousel({
            targetSelector: "#forex-carousel-target",
            carouselId: "forex",
            data: forex,
            cardComponent: forexCard,
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        createCarousel({
            targetSelector: "#commodities-carousel-target",
            carouselId: "commodities",
            data: commodities,
            cardComponent: commodityCard,
            buildUrl: (dataset) => `#/details?type=${dataset.type}&ticker=${dataset.ticker}`
        })

        createCarousel({
            targetSelector: "#analysts-carousel-target",
            carouselId: "analysts",
            data: analystRes,
            cardComponent: analystCard,
            buildUrl: (dataset) => `#/analystdetails?id=${dataset.id}`
        })

    } catch (err) {
        console.error("ERROR :", err)
    }
}