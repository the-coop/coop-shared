import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

import { Chance } from "chance";

export default class Items {

    static async getUserItem(userID, itemCode) {
        const query = {
            name: "get-user-item",
            text: `SELECT * FROM "items" WHERE owner_id = $1 AND item_code = $2`,
            values: [userID, itemCode]
        };
        return DatabaseHelper.single(await Database.query(query));
    }

    static async getUserItemQty(userID, itemCode) {
        let qty = 0;
        const userItem = await this.getUserItem(userID, itemCode);
        if (userItem) qty = userItem.quantity || 0;
        return qty;
    }

    static async hasQty(userID, itemCode, qty) {
        const hasQty = await this.getUserItemQty(userID, itemCode);
        return hasQty >= qty;
    }

    static async subtract(userID, itemCode, subQuantity, takeReason = 'unknown') {
        // If item count goes to zero, remove it
        const query = {
            name: "subtract-item",
            text: `UPDATE items 
                SET quantity = quantity - $3 WHERE owner_id = $1 AND item_code = $2
                RETURNING quantity`,
            values: [userID, itemCode, subQuantity]
        };
        const itemRow = await DatabaseHelper.singleQuery(query);

        // Get the total of that item now.
        const total = await this.count(itemCode);

        // Extract latest/assumed qty.
        let qty = 0;
        const rowQuantity = itemRow?.quantity || null;
        if (itemRow && rowQuantity)
            qty = itemRow.quantity;

        // console.log(qty);

        // Delete EXACT 0 but not < 0, don't keep unnecessary default rows for item ownership.
        if (qty === 0) await this.delete(userID, itemCode)

        // Record the change, with quantity cast to a negative number.
        await this.saveTransaction(userID, itemCode, -subQuantity, total, takeReason);
        return qty;
    }

    static async count(itemCode) {
        const query = {
            name: "count-item",
            text: "SELECT SUM(quantity) FROM items WHERE item_code = $1",
            values: [itemCode]
        };

        const result = DatabaseHelper.single(await Database.query(query));
        const count = result.sum || 0;

        return count;
    }

    static async saveTransaction(userID, item_code, qty, runningQty, reason = 'N/A') {
        const nowSecs = Math.round(Date.now() / 1000);
        const query = {
            name: "record-item-change",
            text: `INSERT INTO item_qty_change_history(owner, item, change, running, note, occurred_secs)
                VALUES($1, $2, $3, $4, $5, $6)`,
            values: [userID, item_code, qty, runningQty, reason, nowSecs]
        };  

        const result = await Database.query(query);
        const successInsert = result.rowCount === 1;

        // TODO: Send via webhook?
        // Send as a record for transparency.
        // const webhookURL = 'https://discord.com/api/webhooks/1011394394923999254/dd96ATB0mE_kubW6jkWmNen2ZKmsjmZnPXbaLj6bHRd_2qMxf--hI3lQsPgeVfKuYnRn';
        // const webhookClient = new WebhookClient({ url: webhookURL });

        // COOP.CHANNELS._send('TRADE', `${userID} ${item_code} ${qty} ${runningQty} ${reason}`);

        // Five percent chance of checking for clean up. (Gets run a lot).
        this.cleanupItemsHistory();
        
        return successInsert;
    }

    // TODO: This is not a permanent solution move to an interval.
    static async cleanupItemsHistory() {
       // Five percent chance of checking for clean up. (Gets run a lot).
       const chance = new Chance;
       if (chance.bool({ likelihood: 5 })) {
           const numTxRows = await this.getTransactionRowCount();
           if (numTxRows > 250) {
               // Delete the last 100.
               try {
                   await Database.query({
                       text: `DELETE FROM item_qty_change_history WHERE id = any (array(SELECT id FROM item_qty_change_history ORDER BY occurred_secs ASC LIMIT 100))`
                   });
               } catch(e) {
                   console.log('Error clipping item qty change history');
                   console.error(e);
               }
           }
       }
    }

    static async getTransactionRowCount() {
        const query = {
            name: "transactions-rows-count",
            text: `SELECT COUNT(*) FROM item_qty_change_history`
        };  

        const result = await Database.query(query);
        const numTxRows = DatabaseHelper.singleField(result, 'count', 0);
        return numTxRows;
    }

    static async delete(userID, itemCode) {
        const query = {
            name: "delete-item",
            text: "DELETE FROM items WHERE owner_id = $1 AND item_code = $2",
            values: [userID, itemCode]
        };
        return await Database.query(query);
    }

    static async add(userID, itemCode, quantity, sourceReason = 'unknown') {
        // TODO: Could make item source throw an error if not declared.
        const query = {
            name: "add-item",
            text: `INSERT INTO items(owner_id, item_code, quantity)
                VALUES($1, $2, $3) 
                ON CONFLICT (owner_id, item_code)
                DO 
                UPDATE SET quantity = items.quantity + EXCLUDED.quantity
                RETURNING quantity`,
            values: [userID, itemCode, quantity]
        };
        
        const result = await Database.query(query);
        const newQty = DatabaseHelper.singleField(result, 'quantity', 0)

        // Get the total of that item now.
        const total = await this.count(itemCode);
        
        
        await this.saveTransaction(userID, itemCode, quantity, total, sourceReason);

        return newQty;
    }
    
}