import { roleGuard } from "./src/middlewares/roleGuard.js"
import { renderApp } from "./src/utils/layoutManager.js"


async function router() {
  // return to the top of page
  window.document.body.scrollTo(0, 0)
  

  const hash = (window.location.hash.slice(1) || "/").split("?")[0]

  let content = ""
  let init = null
  let layoutType = "default"

  switch (hash) {
    case "/":
      const home = await import("./src/pages/public/home.js")
      content = home.default
      init = home.initHome
      break
    
    case "/list":
      const list = await import("./src/pages/public/list.js")
      content = list.default
      init = list.initList
      break

    case "/details":
      const detailsPage = await import("./src/pages/public/assetsdetails.js")
      content = detailsPage.default
      init = detailsPage.initDetail
      break

    case "/analystdetails":
      const analystdetails = await import("./src/pages/public/analystsdetails.js")
      content = analystdetails.default
      init = analystdetails.initAnalystDetail
      break

    case "/about":
      const about = await import("./src/pages/public/about.js")
      content = about.default
      init = about.initAbout
      break

    case "/register":
      const register = await import("./src/pages/auth/register/register.js")
      content = register.default
      init = register.initRegister
      break

    case "/analystregister":
      const analystRegister = await import("./src/pages/auth/register/analystRegister.js")
      content = analystRegister.default
      init = analystRegister.initAnalystRegister
      break

    case "/login":
      const login = await import("./src/pages/auth/login.js")
      content = login.default
      init = login.initLogin
      break

    case "/user":
      if (!roleGuard(["user"])) return
      const userPage = await import("./src/pages/user/user.js")
      content = userPage.default
      init = userPage.initUser
      break

    case "/admin":
      if (!roleGuard(["admin"])) return
      const adminPage = await import("./src/pages/admin/admin.js")
      content = adminPage.default
      init = adminPage.initAdmin
      layoutType = "admin"
      break

    case "/analyst":
      if (!roleGuard(["analyst"])) return
      const analystPage = await import("./src/pages/analyst/analyst.js")
      content = analystPage.default
      init = analystPage.initAnalyst
      break

    default:
      const notfound = await import("./src/pages/public/notfound.js")
      content = notfound.default
  }

  renderApp(content, layoutType)

  if (init) {
    try {
      // asynchronous waiting for smooth rendering
      await init()
    } catch (err) {
      console.error("Error during initialization :", err)
    }
  }
  // from renderApp
  document.getElementById("root").style.opacity = "1"
}

window.addEventListener("hashchange", router)
// all dependencies loaded and ready to use,browser triggers the first display
window.addEventListener("load", router)


