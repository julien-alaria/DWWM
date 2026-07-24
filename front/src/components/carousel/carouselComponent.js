import { enableCarouselWindow } from "../../utils/lazyloading.js"

const activeCarousels = new Map()

export function createCarousel({ targetSelector, carouselId, data, cardComponent, buildUrl }) {
    const target = document.querySelector(targetSelector)
    if (!target) return

    // Cleans up the previous instance on this target
    const previousCleanup = activeCarousels.get(targetSelector)
    if (previousCleanup) {
        previousCleanup()
        activeCarousels.delete(targetSelector)
    }

    if (!data || data.length === 0) {
        target.innerHTML = "<p>No data available</p>"
        return
    }

    target.innerHTML = ""

    const carouselEl = document.createElement("div")
    carouselEl.className = "carousel"
    carouselEl.id = carouselId
    target.appendChild(carouselEl)

    const cleanup = enableCarouselWindow({
        selector: `#${carouselId}`,
        getData: () => data,
        cardComponent: cardComponent
    })

    if (cleanup) activeCarousels.set(targetSelector, cleanup)

    carouselEl.addEventListener("click", (e) => {
        const card = e.target.closest(".card")
        if (!card) return
        window.location.hash = buildUrl(card.dataset)
    })
}


