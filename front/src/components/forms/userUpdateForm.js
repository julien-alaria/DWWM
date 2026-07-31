export default function updateForm() {
    return `
    <h2>Update Your Profil</h2>
    <form id="user-update-form" class="glass-form">
        <label for="user-name">Name:</label>
        <input type="text" id="user-name" name="name" required minlength="2" maxlength="50" autocomplete="on">

        <label for="user-email">Email:</label>
        <input type="email" id="user-email" name="email" autocomplete="on">

        <label for="user-password">Password:</label>
        <input type="password" id="user-password" name="password" placeholder="new password..." minlength="6" maxlength="20" autocomplete="new-password">

        <label for="picture">Profile Picture (Image):</label>
        <input type="file" id="picture" name="picture" accept="image/*" />

        <input type="submit" value="update">
    </form>
    `
}