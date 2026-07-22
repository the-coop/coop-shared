import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class Subscription {
    static async getByEmail(email) {
        return DatabaseHelper.singleQuery({
            name: 'get-subscription-by-email',
            text: `SELECT * FROM propaganda_subscriptions WHERE email = ?`,
            values: [email]
        });
    }

    static async create(email, owner = null, level = 1) {
        let result = false;
        const creation = await Database.query({
            name: 'create-subscription',
            text: `INSERT INTO propaganda_subscriptions
                (email, level, owner_id, subscribed_at) 
                VALUES(?, ?, ?, ?)`,
            values: [email, level, owner, Math.round(Date.now() / 1000)]
        });
        if (typeof creation.rowCount !== 'undefined') {
            if (creation.rowCount === 1) result = true;
        }
        return result;
    }

    static async unsubscribeByEmail(email) {
        let result = false;
        const query = {
            name: 'unsubscribe-by-email',
            text: `DELETE FROM propaganda_subscriptions WHERE email = ?`,
            values: [email]
        };
        const response = await Database.query(query);
        if (typeof response.rowCount !== 'undefined') {
            if (response.rowCount === 1) result = true;
        }
        return result;
    }
    
}