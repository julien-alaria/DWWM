import navLink from "../navLinks/navLink.js"
import { getAuthenticatedUser } from "../../middlewares/roleGuard.js"

export default function footer() {

    const user = getAuthenticatedUser()

    return `
        <footer class="main-footer">
            <div class="footer-socials">

                <div class="footer-nav" id="footer-about">
                    ${navLink("/about", "ABOUT")}
                </div>

                <div class="footer-main">
                    <h2>TRADER TRACKER</h2>

                    <div class="footer-icons">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="RSS"><i class="fas fa-rss"></i></a>
                    </div>
                </div>

                <div class="footer-btn">
                    ${user ? "" : navLink("/register", "CREATE FREE ACCOUNT", "nav-register")}
                </div>
   
            </div>

            <div class="footer-bottom">
                <span>© ${new Date().getFullYear()} Trader Tracker. All rights reserved.</span>
            </div>
        </footer>
    `
}