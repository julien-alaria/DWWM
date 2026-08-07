import { getAuthenticatedUser } from "../../middlewares/roleGuard.js"

// =====================
// HTML TEMPLATE
// =====================
const about = `
    <section id="about-hero">
        <h1 id="about-hero-title">ABOUT TRADER TRACKER</h1>
        <p id="about-hero-text">A simplified platform to track financial assets and follow the analysts who cover them.</p>
    </section>

    <section id="about-mission">
        <h2 id="about-mission-title">OUR MISSION</h2>
        <p id="about-mission-text">
            Investing shouldn't mean juggling ten different platforms. Between brokers, social networks
            and streaming channels, useful information is scattered everywhere. Trader Tracker brings
            market data, price tracking and analyst recommendations together in a single, simple place,
            so investors can make informed decisions without the noise.
        </p>
    </section>

    <section id="about-roles">
        <h2 id="about-roles-title">HOW IT WORKS</h2>
        <div id="about-roles-grid">
            <article class="about-role-card">
                <h3>Visitor</h3>
                <p>Browse the full catalog of assets, their details, and public analyst recommendations, with no account required.</p>
            </article>
            <article class="about-role-card">
                <h3>Investor</h3>
                <p>Create a free account to follow assets and analysts, and keep track of everything in a personal dashboard.</p>
            </article>
            <article class="about-role-card">
                <h3>Analyst</h3>
                <p>Once verified by an administrator, publish BUY / SELL / HOLD recommendations on the assets matching your specialization.</p>
            </article>
            <article class="about-role-card">
                <h3>Administrator</h3>
                <p>Approve analyst accounts and oversee published recommendations to keep the platform reliable.</p>
            </article>
        </div>

    </section>

    <section id="about-cta">
        <p id="about-cta-text">Ready to start tracking your investments?</p>
        <a id="about-cta-register" href="#/register">CREATE FREE ACCOUNT</a>
    </section>

    <section id="about-stack">
        <h2 id="about-stack-title">BUILT WITH</h2>
        <ul id="about-stack-list">
            <li>Node.js &amp; Express</li>
            <li>MySQL</li>
            <li>Vanilla JavaScript (ES6 modules)</li>
            <li>Massive API for market data</li>
        </ul>
    </section>

    <section id="about-privacy">
        <h2 id="about-privacy-title">DATA & PRIVACY</h2>
        <p id="about-privacy-text">
            We collect only the data necessary to operate your account: name, email,
            and password for every user, plus company, bio, and certification documents
            for users applying as analysts. Your data is never sold or shared with third parties.
            You can update or delete your account at any time from your profile settings.
        </p>
    </section>

    <section id="about-credits">
        <h2 id="about-credits-title">ABOUT THIS PROJECT</h2>
        <p id="about-credits-text">
            Trader Tracker is a fictional project as part of the
            Développeur Web et Web Mobile certification.
        </p>
    </section>
`

export default about

export async function initAbout() {
    try {
        // =====================
        // AUTH CHECK — hide CTA buttons if logged in
        // =====================
        const user = getAuthenticatedUser()
        if (user) {
            document.getElementById("home-top-register")?.remove()
            document.getElementById("home-middle-register")?.remove()
            document.getElementById("about-cta-register")?.remove()
        }

    } catch (error) {
        console.error("DETAILS INIT ERROR:", error)
    }
    

}