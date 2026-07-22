import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class Users {

    // loadSortedHistoricalPoints
    // loadAllForStaticGeneration
    // loadSingleForStaticGeneration
    // load
    // searchByUsername
    
    static async count() {
        const result = await DatabaseHelper.singleQuery({
            name: "count-users",
            text: "SELECT COUNT(*) AS count FROM users"
        });
        const userCount = result.count;
        return userCount;
    }
    
    static loadSingleConquest(id) {
        return DatabaseHelper.singleQuery({
            name: "get-user-conquest",
            text: "SELECT discord_id, x, y, z FROM users WHERE discord_id = ?",
            values: [id]
        });
    }

	static async get(id) {
        const query = {
            name: "get-user",
            text: "SELECT * FROM users WHERE discord_id = ?",
            values: [id]
        };

        const result = await Database.query(query);
        return DatabaseHelper.single(result);
	}

    static async searchByUsername(username) {
        const results = await DatabaseHelper.manyQuery({
            text: `SELECT *, roles.role_list FROM users

                LEFT JOIN (
                    SELECT array_agg(ur.role_code) AS role_list, discord_id
                    FROM user_roles ur
                    GROUP BY ur.discord_id
                ) roles USING (discord_id) 

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'item_code', it.item_code,
                            'quantity', it.quantity
                        )) AS item_list,
                        owner_id
                    FROM items it
                    GROUP BY it.owner_id
                ) items ON users.discord_id = items.owner_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'author_username', bp.author_username,
                            'slug', bp.slug
                        )) AS blog_posts,
                        author_id
                    FROM blog_posts bp
                    GROUP BY bp.author_id
                ) blog_posts ON users.discord_id = blog_posts.author_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'slug', pr.slug
                        )) AS project_list,
                        owner_id
                    FROM projects pr
                    GROUP BY pr.owner_id
                ) projects ON users.discord_id = projects.owner_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'tile', ba.face_id
                        )) AS base_list,
                        owner_id
                    FROM bases ba
                    GROUP BY ba.owner_id
                ) bases ON users.discord_id = bases.owner_id

                WHERE username LIKE ?
            `,
            values: [username]
        });
        return results;
    }

    static async loadSingleForStaticGeneration(discordID) {
        const query = {
            text: `SELECT *, roles.role_list 
                FROM users

                LEFT JOIN (
                    SELECT array_agg(ur.role_code) AS role_list, discord_id
                    FROM user_roles ur
                    GROUP BY ur.discord_id
                ) roles USING (discord_id)

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'item_code', it.item_code,
                            'quantity', it.quantity
                        )) AS item_list,
                        owner_id
                    FROM items it
                    GROUP BY it.owner_id
                ) items ON users.discord_id = items.owner_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'author_username', bp.author_username,
                            'slug', bp.slug
                        )) AS blog_posts,
                        author_id
                    FROM blog_posts bp
                    GROUP BY bp.author_id
                ) blog_posts ON users.discord_id = blog_posts.author_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'slug', pr.slug
                        )) AS project_list,
                        owner_id
                    FROM projects pr
                    GROUP BY pr.owner_id
                ) projects ON users.discord_id = projects.owner_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'tile', ba.face_id
                        )) AS base_list,
                        owner_id
                    FROM bases ba
                    GROUP BY ba.owner_id
                ) bases ON users.discord_id = bases.owner_id

                WHERE discord_id = ?
            `,
            values: [discordID]
        };
        const result = await DatabaseHelper.singleQuery(query);        
        return result;
    }

    static async loadAllForStaticGeneration() {
        const query = {
            text: `SELECT *, roles.role_list 
                FROM users
                
                JOIN (
                    SELECT array_agg(ur.role_code) AS role_list, discord_id
                    FROM user_roles ur
                    GROUP BY ur.discord_id
                ) roles USING (discord_id)
                
                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'item_code', it.item_code,
                            'quantity', it.quantity
                        )) AS item_list,
                        owner_id
                    FROM items it
                    GROUP BY it.owner_id
                ) items ON users.discord_id = items.owner_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'author_username', bp.author_username,
                            'slug', bp.slug
                        )) AS blog_posts,
                        author_id
                    FROM blog_posts bp
                    GROUP BY bp.author_id
                ) blog_posts ON users.discord_id = blog_posts.author_id

                LEFT JOIN (
                    SELECT 
                        json_agg(json_build_object(
                            'tile', ba.face_id
                        )) AS base_list,
                        owner_id
                    FROM bases ba
                    GROUP BY ba.owner_id
                ) bases ON users.discord_id = bases.owner_id

                ORDER BY historical_points DESC NULLS LAST
            `
        };
        const result = await Database.query(query);        
        const rows = await DatabaseHelper.many(result);
        return rows;
    }


}