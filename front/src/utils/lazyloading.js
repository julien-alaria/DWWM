import { loadMiniChart } from "./tradingChart.js"
import { destroyRange } from "./chartManager.js"

export function enableCarouselWindow({ selector = ".carousel", getData, cardComponent }) {

  const initializedTickers = new Set()

  const chartObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target
        
        if (el.dataset.initialized === "true") return
        
        const ticker = el.dataset.ticker
        const historyJson = el.dataset.history

        if (ticker && historyJson) {
            try {
                const historyData = JSON.parse(historyJson)
                
                loadMiniChart(ticker, historyData)
                
                el.dataset.initialized = "true"
                initializedTickers.add(ticker)
                observer.unobserve(el)
            } catch (e) {
                console.error("Parsing history error for", ticker, e)
            }
        }
      }
    })
  }, { threshold: 0.1 })

  const carousel = document.querySelector(selector)
  if (!carousel || carousel.dataset.bound === "true") return
  carousel.dataset.bound = "true"

  const allAssets = getData(carousel) 
  if (!allAssets?.length) return

  const isFixed = allAssets.length <= 2
  const displayAssets = isFixed ? allAssets : [...allAssets].sort(() => 0.5 - Math.random()).slice(0, 30)

  carousel.innerHTML = ""
  const track = document.createElement("div")
  track.className = "carousel-track"
  track.style.transform = "translateX(0px)"
  track.style.transition = "none"
  
  if (isFixed) {
      track.classList.add("is-fixed")
  }
  
  carousel.appendChild(track)

  const render = () => {
    track.innerHTML = displayAssets.map(asset => cardComponent(asset)).join("") 
  
    track.querySelectorAll(".chart").forEach(el => {
        const cardParent = el.closest("[data-ticker]")
        const ticker = cardParent?.dataset.ticker
      
        if (ticker) {
            el.dataset.ticker = ticker
            chartObserver.observe(el)
        }
    })
  }

  render()

  const baseCleanup = () => {
    chartObserver.disconnect()
    destroyRange([...initializedTickers])
    carousel.dataset.bound = ""
  }

  // on small list no scroll
  if (isFixed) return baseCleanup

  // infinite scroll for wide lists
  const remToPx = (remStr) => {
    const rootFontSize = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16
    return parseFloat(remStr) * rootFontSize
  }

  const getCardWidth = () => {
    const firstCard = track.firstElementChild
    const gap = parseFloat(window.getComputedStyle(track).gap) || 24 // gap flexbox réel du track, pas un margin sur .card

    if (firstCard) {
      return firstCard.offsetWidth + gap
    }

    // Pas de carte à mesurer : on lit --card-w (source de vérité CSS, gère aussi le responsive)
    const cardWidthRem = window.getComputedStyle(document.documentElement).getPropertyValue('--card-w').trim() || '9.5rem'
    return remToPx(cardWidthRem) + gap
  };

  let currentX = 0;
  let targetX = 0;
  const ease = 0.08;
  let isReorganizing = false;
  let cardWidth = getCardWidth(); // Calculé au chargement
  let rafId = null;
  let isDestroyed = false;

  // Recalcule si l'utilisateur redimensionne la fenêtre
  const handleResize = () => { cardWidth = getCardWidth(); }
  window.addEventListener('resize', handleResize);

  const updateLoop = () => {
    if (isDestroyed) return;
    if (isReorganizing) { rafId = requestAnimationFrame(updateLoop); return; }
    
    const distance = targetX - currentX;
    if (Math.abs(distance) > 0.05) {
      currentX += distance * ease;
      
      // On utilise cardWidth (dynamique) au lieu de CARD_WIDTH (fixe)
      if (currentX >= cardWidth || currentX <= 0) {
        isReorganizing = true;
        
        if (currentX >= cardWidth) {
          const firstCard = track.firstElementChild;
          if (firstCard) {
            track.appendChild(firstCard);
            currentX -= cardWidth;
            targetX -= cardWidth;
            
            const chartEl = firstCard.querySelector(".chart");
            if (chartEl && !chartEl.dataset.initialized) {
                setTimeout(() => chartObserver.observe(chartEl), 0);
            }
          }
        } else {
          const lastCard = track.lastElementChild;
          if (lastCard) {
            track.insertBefore(lastCard, track.firstElementChild);
            currentX += cardWidth;
            targetX += cardWidth;
            
            const chartEl = lastCard.querySelector(".chart");
            if (chartEl && !chartEl.dataset.initialized) {
                setTimeout(() => chartObserver.observe(chartEl), 0);
            }
          }
        }
        requestAnimationFrame(() => { isReorganizing = false; });
      }
      track.style.transform = `translateX(${-currentX}px)`;
    }
    rafId = requestAnimationFrame(updateLoop);
  }

  rafId = requestAnimationFrame(updateLoop)

  const handleWheel = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.deltaY) return
    targetX += e.deltaY * 1.2
  }
  carousel.addEventListener("wheel", handleWheel, { passive: false })

  // scroll au doigt (mobile/tactile)
  let touchLastX = 0

  const handleTouchStart = (e) => {
    touchLastX = e.touches[0].clientX
  }
  const handleTouchMove = (e) => {
    const x = e.touches[0].clientX
    targetX += touchLastX - x
    touchLastX = x
  }

  carousel.addEventListener("touchstart", handleTouchStart, { passive: true })
  carousel.addEventListener("touchmove", handleTouchMove, { passive: true })

  return () => {
    isDestroyed = true
    if (rafId) cancelAnimationFrame(rafId)
    window.removeEventListener('resize', handleResize)
    carousel.removeEventListener("wheel", handleWheel)
    carousel.removeEventListener("touchstart", handleTouchStart)
    carousel.removeEventListener("touchmove", handleTouchMove)
    chartObserver.disconnect()
    destroyRange([...initializedTickers])
    carousel.dataset.bound = ""
  }
}