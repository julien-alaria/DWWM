import navLink from "../navLinks/navLink.js"
import { getAuthenticatedUser } from "../../middlewares/roleGuard.js"

export default function navbar() {

    const user = getAuthenticatedUser()

    return `
        <nav class="main-navbar">
            ${navLink("/", "TRADER TRACKER", "nav-home")}
           
            ${user ? "" : navLink("/login", "Sign In", "nav-login")}
            ${user ? "" : navLink("/register", "CREATE FREE ACCOUNT", "nav-register")}

            ${user?.role === "admin" ? navLink("/admin", "Admin",  "nav-admin") : ""}
            ${user?.role === "user" ? navLink("/user", "User", "nav-user") : ""}
            ${user?.role === "analyst" ? navLink("/analyst", "Analyst", "nav-analyst") : ""}

            ${user ? `<button id="logout-btn">Logout</button>` : ""}
        </nav>
    `
}
