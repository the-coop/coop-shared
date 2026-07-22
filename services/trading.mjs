import Database from "../setup/database.mjs";
import DatabaseHelper from "../helper/databaseHelper.mjs";

import Items from '../services/items.mjs';
import Useable from "./useable.mjs";

export default class Trading {

    // Defaults to returning 15 latest trades.
    static async all(limit = 15) {
        const query = {
            name: "get-all-trades",
            text: `SELECT * FROM open_trades ORDER BY id DESC LIMIT ?;`,
            values: [limit]
        };

        const result = await Database.query(query);
        return DatabaseHelper.many(result);
    }

    static async getByTrader(traderID) {
        const query = {
            name: "get-open-by-trader-id",
            text: `SELECT * FROM open_trades WHERE trader_id = ? ORDER BY id DESC`,
            values: [traderID]
        };
        
        const result = await Database.query(query);
        return DatabaseHelper.many(result);
    }

    static async remove(tradeID) {
        const query = {
            name: "remove-trade-id",
            text: `DELETE FROM open_trades WHERE id = ?`,
            values: [tradeID]
        };

        const result = await Database.query(query);
        return result;
    }

    static async get(tradeID) {
        const query = {
            name: "get-open-trade-id",
            text: `SELECT * FROM open_trades WHERE id = ?`,
            values: [tradeID]
        };
        
        const result = await Database.query(query);
        return DatabaseHelper.single(result);
    }

    static async create(userID, username, offerItem, receiveItem, offerQty, receiveQty) {
        const query = {
            name: "create-trade",
            text: `INSERT INTO open_trades(trader_id, trader_username, offer_item, receive_item, offer_qty, receive_qty)
                VALUES (?, ?, ?, ?, ?, ?)`,
            values: [userID, username, offerItem, receiveItem, offerQty, receiveQty]
        };
        // MySQL has no RETURNING: insert, then read the new row back by its id.
        const { insertId } = await Database.query(query);
        return await this.get(insertId);
    }

    static async close(trade) {
        try {
            // Add the offer items to the cancelee.
            await Items.add(trade.trader_id, trade.offer_item, trade.offer_qty, 'Trade cancelled');

            // Delete/close the open trade offer.
            await this.remove(trade.id);

            return true;

        } catch(e) {
            console.log('Error cancelling trade offer.');
            console.error(e);
            return false;
        }        
    }

    static async resolve(trade, accepteeID) {
        try {
            const didUse = await Useable.use(accepteeID, trade.receive_item, trade.receive_qty);
            if (didUse) {
                // Add the offer items to the acceptee.
                await Items.add(accepteeID, trade.offer_item, trade.offer_qty, 'Trade accepted');
    
                // Add the receive items to the trader.
                await Items.add(trade.trader_id, trade.receive_item, trade.receive_qty, 'Trade accepted');
    
                // Delete/close the open trade offer.
                await this.remove(trade.id);

                return true;
            }
        } catch(e) {
            console.log('Accepting trade error');
            console.error(e);
        }
        return false;
    }

}