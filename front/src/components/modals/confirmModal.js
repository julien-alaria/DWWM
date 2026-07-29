// Reusable confirmation modal (glassmorphism), used for any action that
// needs an explicit "are you sure?" step before running. Supports an
// optional password field for sensitive actions (e.g. account deletion).
//
// Usage:
// openConfirmModal({
//     title: "Delete account",
//     message: "This action is permanent...",
//     requirePassword: true,
//     danger: true,
//     confirmLabel: "Delete my account",
//     onConfirm: async (password) => {
//         await http.delete("/users/me", { password })
//     }
// })
//
// onConfirm can be async and can throw (e.g. a caught http error); the
// modal will display the error message inline and stay open so the user
// can retry, instead of closing on failure.
export function openConfirmModal({
    title = "Are you sure?",
    message = "",
    requirePassword = false,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm
}) {
    // Only one modal at a time
    document.getElementById("confirm-modal-overlay")?.remove()

    const overlay = document.createElement("div")
    overlay.id = "confirm-modal-overlay"
    overlay.className = "confirm-modal-overlay"

    overlay.innerHTML = `
        <div class="confirm-modal glass-form${danger ? " confirm-modal-danger" : ""}" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
            <h2 id="confirm-modal-title">${title}</h2>
            ${message ? `<p class="confirm-modal-message">${message}</p>` : ""}
            ${requirePassword ? `
                <label for="confirm-modal-password">Mot de passe :</label>
                <input type="password" id="confirm-modal-password" name="password" autocomplete="current-password" required />
            ` : ""}
            <p class="confirm-modal-error" id="confirm-modal-error" hidden></p>
            <div class="confirm-modal-actions">
                <button type="button" id="confirm-modal-cancel">${cancelLabel}</button>
                <button type="button" id="confirm-modal-confirm"${danger ? ' class="confirm-modal-confirm-danger"' : ""}>${confirmLabel}</button>
            </div>
        </div>
    `

    document.body.appendChild(overlay)

    const closeModal = () => {
        overlay.remove()
        document.removeEventListener("keydown", onKeydown)
    }

    const onKeydown = (e) => {
        if (e.key === "Escape") closeModal()
    }
    document.addEventListener("keydown", onKeydown)

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal()
    })

    document.getElementById("confirm-modal-cancel").addEventListener("click", closeModal)

    const passwordInput = document.getElementById("confirm-modal-password")
    const errorEl = document.getElementById("confirm-modal-error")
    const confirmBtn = document.getElementById("confirm-modal-confirm")

    passwordInput?.focus()

    const showError = (text) => {
        errorEl.textContent = text
        errorEl.hidden = false
    }

    const handleConfirm = async () => {
        const password = passwordInput ? passwordInput.value : undefined

        if (requirePassword && !password) {
            showError("Merci de saisir votre mot de passe.")
            return
        }

        errorEl.hidden = true
        confirmBtn.disabled = true
        const originalLabel = confirmBtn.textContent
        confirmBtn.textContent = "..."

        try {
            await onConfirm(password)
            closeModal()
        } catch (err) {
            showError(err?.response?.data?.message || err?.message || "Une erreur est survenue.")
            confirmBtn.disabled = false
            confirmBtn.textContent = originalLabel
        }
    }

    confirmBtn.addEventListener("click", handleConfirm)

    passwordInput?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleConfirm()
        }
    })
}