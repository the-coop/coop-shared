import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class UserRoles {

    static all() {
        return DatabaseHelper.manyQuery({
            text: 'SELECT * FROM user_roles'
        })
    }

    static get(id) {
        return DatabaseHelper.manyQuery({
            text: 'SELECT * FROM user_roles WHERE discord_id = ?',
            values: [id]
        });
    }

    static find(discordID, roleID) {
         return DatabaseHelper.singleQuery({
            text: 'SELECT * FROM user_roles WHERE discord_id = ? AND role_id = ?',
            values: [discordID, roleID]
        });
    }

    static add(id, roleCode, roleID) {
        return DatabaseHelper.manyQuery({
            text: 'INSERT INTO user_roles(discord_id, role_code, role_id) VALUES(?, ?, ?)',
            values: [id, roleCode, roleID]
        });
    }

    static remove(userID, roleID) {
        return DatabaseHelper.manyQuery({
            text: 'DELETE FROM user_roles WHERE discord_id = ? AND role_id = ?',
            values: [userID, roleID]
        });
    }

}