import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class Projects {

    static async all() {
        const query = {
            name: "get-all-projects-with-username",
            text: `SELECT * FROM projects
                INNER JOIN users 
                ON projects.owner_id = discord_id`
        };
        const result = await DatabaseHelper.manyQuery(query);
        return result;
    }

    static loadBySlug(slug) {
        return DatabaseHelper.singleQuery({
            name: "load-project-slug", 
            text: `SELECT * FROM projects
                    JOIN users 
                    ON projects.owner_id = discord_id
                WHERE slug = ?`,
            values: [slug]
        });
    }

}