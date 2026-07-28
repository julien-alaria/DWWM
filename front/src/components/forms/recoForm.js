export default function recoForm() {
    return `
        <h2>Create Recommendation</h2>
            <form id="rec-form" class="glass-form">
                <select name="status">
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                    <option value="HOLD">HOLD</option>
                </select>

                <textarea name="comment" maxlength="280" placeholder="Comment"></textarea>

                <button type="submit">Submit</button>
                <div id="message"></div>
            </form>
    `
}