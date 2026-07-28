import http from "../../../config/instanceHttp.js"

// =====================
// HTML TEMPLATE 
// =====================
const analystRegister = `
    <h1 class="form-title">Register as Analyst</h1>
    <form method="post" id="analyst-form" class="glass-form" enctype="multipart/form-data">
        
        <input type="text" id="name" name="name" placeholder="enter your name..." required minlength="2" maxlength="50" autocomplete="on">

        <input type="email" id="email" name="email" placeholder="enter your email..." required autocomplete="on">

        <input type="password" id="password" name="password" placeholder="enter your password..." minlength="6" maxlength="20" required autocomplete="on">

        <input type="text" id="company" name="company" placeholder="your Company / Organization" maxlength="100" autocomplete="on">

        <textarea id="bio" name="bio" rows="5" cols="33" maxlength="1000" placeholder="Tell us about your background..."></textarea>

        <input type="hidden" id="role" name="role" value="analyst" />

        <fieldset>
            <p>Select your asset type :</p>
            <div>
                <input type="radio" id="asset-type1" name="analyst_type_id" value="1" required />
                <label for="asset-type1">Forex</label>

                <input type="radio" id="asset-type2" name="analyst_type_id" value="2" required />
                <label for="asset-type2">Nasdaq</label>

                <input type="radio" id="asset-type3" name="analyst_type_id" value="3" required />
                <label for="asset-type3">Comex</label>
            </div>
        </fieldset>

        <label for="picture">Profile Picture (Image):</label>
        <input type="file" id="picture" name="picture" accept="image/*" />

        <label for="document">Certification (PDF):</label>
        <input type="file" id="document" name="document" accept=".pdf" />

        <input type="submit" value="submit">
        <div id="message"></div>
    </form>
    `

export default analystRegister

// =====================
// INIT
// =====================
export async function initAnalystRegister() {
    try {
        // security waiting before DOM injection
        await new Promise(resolve => setTimeout(resolve, 0))

        const form = document.getElementById("analyst-form")
        const messageDiv = document.getElementById("message")

        if (!form || !messageDiv) return

        form.addEventListener("submit", async function (e) {
            e.preventDefault()
            messageDiv.innerText = ""

            const data = new FormData(form)

            try {
                const result = await http.post("/auth/register", data)
                console.log("REGISTER OK:", result)

                if (result?.token) {
                    localStorage.setItem("token", result.token)
                    messageDiv.innerText = "Registration successful. Redirecting..."

                    setTimeout(() => {
                        window.location.hash = "#/" // Adding '#' for router
                    }, 1000)
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