// commodityCards.js
import { formatAssetImage } from "../../utils/imageHelper.js"
import { escapeHtml } from "../../utils/format.js"

export default function commodityCard({ 
  name = 'Unknown commodity', 
  ticker = 'N/A', 
  price = 'N/A', 
  high = 'N/A', 
  low = 'N/A', 
} = {}) {

  const finalImage = formatAssetImage(ticker)

  return `
    <div class="card commodity" data-type="commodity" data-ticker="${escapeHtml(ticker)}">

      <img class="card-commodity-image" src="${finalImage}" alt="${escapeHtml(ticker)}" onerror="this.onerror=null; this.src='/assets/nasdaq_logo.webp'">

      <h3 class="card-commodity-title">${escapeHtml(name)}</h3>

      <p class="card-commodity-ticker">Ticker: ${escapeHtml(ticker)}</p>

      <p class="card-commodity-price">${escapeHtml(price)} $</p>

      <p class="card-commodity-high">High: ${escapeHtml(high)}</p>

      <p class="card-commodity-low">Low: ${escapeHtml(low)}</p>

    </div>
  `
}