import mysql from 'mysql2/promise';

// MySQL connection pool. Queries are written natively for MySQL (using '?' placeholders);
// query() just executes them. The result is exposed as { rows, rowCount } so the existing
// DatabaseHelper (single/many/singleField) and call sites keep reading results the same way.
export default class Database {

    static connection = null;

    static async connect() {
        if (!this.connection) {
            const url = new URL(process.env.DATABASE_URL);

            // SSL on by default (mirrors the old pg config). Set DB_SSL=false for a
            // local server without TLS.
            const ssl = process.env.DB_SSL === 'false'
                ? undefined
                : { rejectUnauthorized: false };

            this.connection = mysql.createPool({
                host: url.hostname,
                port: url.port ? Number(url.port) : 3306,
                user: decodeURIComponent(url.username),
                password: decodeURIComponent(url.password),
                database: url.pathname.replace(/^\//, ''),
                ssl,
                waitForConnections: true,
                connectionLimit: 10,
                maxIdle: 10,
                enableKeepAlive: true,
                charset: 'utf8mb4'
            });

            // Fail fast if the database is unreachable.
            await this.connection.query('SELECT 1');
        }
    }

    static async query(query) {
        const sql = typeof query === 'string' ? query : query.text;
        const values = (typeof query === 'string' ? [] : query.values) || [];

        const [result] = await this.connection.query(sql, values);

        // SELECT -> array of rows; write -> ResultSetHeader.
        if (Array.isArray(result))
            return { rows: result, rowCount: result.length };

        return {
            rows: [],
            rowCount: result.affectedRows ?? 0,
            insertId: result.insertId
        };
    }
}
