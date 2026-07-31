export default function analystUpdateForm() {
    return `
        <h2>Update Your Profil</h2>
        <form method="post" id="analyst-update-form" class="glass-form">
            <label for="analyst-name">Name:</label>
            <input type="text" id="analyst-name" name="name" required minlength="2" maxlength="50" autocomplete="on">
            
            <input type="hidden" id="target-user-id" name="target_user_id" value="">

            <label for="analyst-email">Email:</label>
            <input type="email" id="analyst-email" name="email" required autocomplete="on">

            <label for="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="new password..." minlength="6" maxlength="20" autocomplete="new-password">

            <label for="analyst-company">Company:</label>
            <input type="text" id="analyst-company" name="company" maxlength="100" autocomplete="on">

            <label for="analyst-bio">Biography:</label>
            <textarea id="analyst-bio" name="bio" rows="5" cols="33" maxlength="1000"></textarea>

            <label for="picture">Profile Picture (Image):</label>
            <input type="file" id="picture" name="picture" accept="image/*" />

            <input type="hidden" id="role" name="role" value="analyst" />

            <input type="submit" value="update">
        </form>
    `
}