import http from "../config/instanceHttp.js"
import { openConfirmModal } from "../components/modals/confirmModal.js"

// Wires the "Supprimer mon compte" button of the danger zone. Shared
// between user.js and analyst.js (identical behavior on both profile
// pages) — only the confirmation message text differs per role, hence
// the optional parameter instead of hardcoding it here.
export function initDeleteAccount(message = "Cette action est définitive. Confirmez-vous ?") {
    const btn = document.getElementById("delete-account-btn")
    if (!btn) return

    btn.addEventListener("click", () => {
        openConfirmModal({
            title: "Supprimer mon compte",
            message,
            danger: true,
            confirmLabel: "Supprimer définitivement",
            cancelLabel: "Annuler",
            onConfirm: async () => {
                await http.delete("/users/me")

                localStorage.removeItem("token")
                window.location.hash = "/"
                window.location.reload()
            }
        })
    })
}