import { createPaginator } from "../../utils/pagination.js"

export function createPaginationList({ 
  targetSelector, 
  prefix, 
  endpoint, 
  itemTemplate, 
  buildUrl,
  limit = 5,
  emptyMessage = "No recommendations yet" }) {

    const target = document.querySelector(targetSelector)
    if (!target) return null

    const containerId = `${prefix}-list-container`
    const paginationId = `${prefix}-pagination`
    const prevBtnId = `${prefix}-prev-btn`
    const nextBtnId = `${prefix}-next-btn`

    target.innerHTML = `
        <div id="${containerId}"></div>
        <div class="id-pagination" id="${paginationId}" style="display: none;">
            <button class="paginBtn" id="${prevBtnId}">Previous</button>
            <button class="paginBtn" id="${nextBtnId}">Next</button>
        </div>
    `

    const paginator = createPaginator({
      endpoint: endpoint,
      limit: limit,
      render: (results) => {
          const container = document.getElementById(containerId)
          if (!container) return
          
          if (results.length === 0) {
            container.innerHTML = `<p id="p-text">${emptyMessage}</p>`
            return
          }
          container.innerHTML = results.map(item => itemTemplate(item)).join("")
      },
    mapResponse: (res, currentOffset) => {
        const wrapper = document.getElementById(paginationId);
        if (!wrapper) return res;

        const globalContainer = document.getElementById(`${prefix}-list-global`);
        
        const show = (res.results.length >= limit || currentOffset > 0 || res.hasNext);

        wrapper.style.display = show ? "flex" : "none";

        if (globalContainer) {
            globalContainer.style.display = show ? "flex" : "none";
        }

        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);
        if (prevBtn) prevBtn.style.display = (currentOffset > 0) ? "block" : "none";
        if (nextBtn) nextBtn.style.display = res.hasNext ? "block" : "none";

        return res;
    }
  })

  target.addEventListener("click", (e) => {
      if (e.target.id === nextBtnId) {
          paginator.next()
          return
      } 
      if (e.target.id === prevBtnId) {
          paginator.prev()
          return
      }

      if (e.target.closest(".delete-btn") || e.target.closest(".edit-form")) {
          return
      }

      const item = e.target.closest("[data-js-clickable]")
      if (item) {
          window.location.hash = buildUrl(item.dataset)
      }
  })

  return paginator
}