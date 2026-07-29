import http from "../../config/instanceHttp.js"
import { getRoleFromToken } from "../../middlewares/roleGuard.js"

// =====================
// HTML TEMPLATE 
// =====================
const login = `  
    <form id="login-form" class="glass-form">
        <h2 class="form-title">Sign In</h2>
        
        <div class="input-group">
            <input type="email" id="email" name="email" placeholder="enter your email..." required autocomplete="on">
        </div>

        <div class="input-group">
            <input type="password" id="password" name="password" placeholder="enter your password..." required autocomplete="off">
        </div>

        <input type="submit" value="SIGN IN">
        
        <div id="message"></div>

        <div class="separator">
            <span class="line"></span>
            <span class="text">OR</span>
            <span class="line"></span>
        </div>

        <div class="form-footer">
            <a id="home-middle-register" href="#/register">CREATE FREE ACCOUNT</a>
        </div>
    </form>
`

// =====================
// INIT
// =====================
export function initLogin() {
    const form = document.querySelector("#login-form")

    const messageDiv = document.getElementById("message")

    form.addEventListener("submit", async function(e){
        e.preventDefault()

        messageDiv.innerText = ""
        
        const data = new FormData(form)

        try {
            const result = await http.post("/auth/login", {
                email: data.get("email"),
                password: data.get("password")
            })

            const token = result.token

            if (!token) {
                messageDiv.innerText = "Login failed. Invalid server response."
                return
            }

            localStorage.setItem("token", token)
            const role = getRoleFromToken(token)

            if (!role) {
                localStorage.removeItem("token")
                messageDiv.innerText = "Login failed. Invalid role assignment."
                return
            }

            messageDiv.innerText = "login successful."

            setTimeout(() => {

                switch (role) {
                    case "admin":
                        window.location.hash = "/admin"
                        break
                    case "analyst":
                        window.location.hash = "/analyst"
                        break
                    default:
                        window.location.hash = "/user"
                }
            }, 1000)
            
        } catch (error) {
            messageDiv.innerText = error.response?.data?.message || "Invalid email or password."
            console.error("Login failed :", error)
        }
    })
}

export default login