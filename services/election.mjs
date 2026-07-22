import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

export default class Election {

    static async loadHierarchy() {
        const hierarchy = {
            commander: await this.loadHierarchySingleType('COMMANDER') || null,
            leaders: await this.loadHierarchyEntitiesByType('LEADER') || [],
            motw: await this.loadHierarchySingleType('MEMBEROFWEEK') || null
        }
        return hierarchy;
    }

    static loadHierarchySingleType(type) {
        return DatabaseHelper.singleQuery({
            text: "SELECT * FROM hierarchy WHERE type = ?",
            values: [type]
        });
    }

    static loadHierarchyEntitiesByType(type) {
        return DatabaseHelper.manyQuery({
            text: "SELECT * FROM hierarchy WHERE type = ?",
            values: [type]
        });
    }

}