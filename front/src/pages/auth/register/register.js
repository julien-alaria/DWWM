import http from "../../../config/instanceHttp.js"

// =====================
// HTML TEMPLATE 
// =====================
const register = ` 
    <h1 class="form-title">Register</h1>
    <form id="register-form" class="glass-form">
        <input type="text" id="name" name="name" placeholder="enter your name..." minlength="2" maxlength="50" required autocomplete="on">

        <input type="email" id="email" name="email" placeholder="enter your email..." required autocomplete="on">

        <input type="password" id="password" name="password" placeholder="enter your password..." minlength="6" maxlength="20" required autocomplete="on">

        <input type="submit" value="submit">
        <div id="message"></div>
    </form>
    <div id="register-text">
        <a href="#/analystregister" class="btn">Register as Analyst?</a>
    </div>
    `

export default register

// =====================
// INIT
// =====================
export async function initRegister() {
    try {
        // security waiting before DOM injection
        await new Promise(resolve => setTimeout(resolve, 0))

        const form = document.querySelector("#register-form")
        const messageDiv = document.getElementById("message")

        if (!form || !messageDiv) return

        form.addEventListener("submit", async function (e) {
            e.preventDefault()
            messageDiv.innerText = ""

            const data = new FormData(form)

            try {
                const result = await http.post("/auth/register", data)
                console.log("REGISTER OK:", result?.token)

                if (result?.token) {
                    localStorage.setItem("token", result.token)
                    messageDiv.innerText = "Registration successful. Redirecting..."

                    setTimeout(() => {
                        window.location.hash = "#/"
                    }, 1000);
                } else {
                    messageDiv.innerText = "Account created, but automatic login failed."
                }

            } catch (error) {
                messageDiv.innerText = error.response?.data?.message || error.message || "An error occurred during registration."
                console.error("Register failed:", error)
            }
        })
    } catch (err) {
        console.error("INIT REGISTER ERROR:", err)
    }
}