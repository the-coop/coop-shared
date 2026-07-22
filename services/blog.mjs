import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class Blog {

    static loadHeadlines() {
        return DatabaseHelper.manyQuery({
            name: "load-headlines", text: `SELECT title, slug, id, author_id, author_username, date FROM blog_posts`
        });
    }

    static loadAllForBuild() {
        return DatabaseHelper.manyQuery({
            name: "load-posts-build-intent", text: `SELECT * FROM blog_posts`
        });
    }

    static loadPostBySlug(slug) {
        return DatabaseHelper.singleQuery({
            name: "load-post-slug", 
            text: `SELECT * FROM blog_posts WHERE slug = ?`,
            values: [slug]
        });
    }

    static async loadDraftByChannelID(chanID) {
        const draft = await DatabaseHelper.singleQuery({
            name: "load-draft",
            text: `SELECT * FROM post_drafts WHERE channel_id = ?`,
            values: [chanID]
        });
        return draft;
    }

}