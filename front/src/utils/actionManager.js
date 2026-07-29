import http from "../config/instanceHttp.js"
import { openConfirmModal } from "../components/modals/confirmModal.js"

export function bindRecommendationActions(targetSelector, paginatorInstance) {
  const container = document.querySelector(targetSelector)
  if (!container) return

  // Click Interceptor (DELETE)
  container.addEventListener("click", (e) => {
    if (!e.target.classList.contains("delete-btn")) return

    const id = e.target.dataset.id
    if (!id) return

    openConfirmModal({
      title: "Delete the recommendation",
      message: "This action is irreversible. Do you confirm the deletion of this recommendation?",
      danger: true,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        await http.delete(`/recommendations/${id}`)
        if (paginatorInstance) await paginatorInstance.load()
      }
    })
  })

  // Submission Interceptor (EDIT)
  container.addEventListener("submit", async (e) => {
    if (!e.target.classList.contains("edit-form")) return
    e.preventDefault()

    const id = e.target.dataset.id
    const data = new FormData(e.target)
    if (!id) return

    try {
      await http.put(`/recommendations/${id}`, {
        status: data.get("status"),
        comment: data.get("comment"),
      })
      if (paginatorInstance) await paginatorInstance.load()
    } catch (err) {
      console.error("CRITICAL UPDATE ERROR:", err)
    }
  })
}