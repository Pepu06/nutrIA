import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { join } from 'path';

class ImageDatabase {
    private db: any;

    constructor() {
        this.initializeDatabase();
    }

    private async initializeDatabase() {
        this.db = await open({
            filename: join(__dirname, '../data/images.db'),
            driver: sqlite3.Database
        });

        await this.db.exec(`
            CREATE TABLE IF NOT EXISTS images (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                image_data BLOB NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    async saveImage(userId: string, imageBuffer: Buffer): Promise<number> {
        const result = await this.db.run(
            'INSERT INTO images (user_id, image_data) VALUES (?, ?)',
            [userId, imageBuffer]
        );
        return result.lastID;
    }

    async getImage(id: number): Promise<{userId: string, imageData: Buffer} | null> {
        const row = await this.db.get(
            'SELECT user_id, image_data FROM images WHERE id = ?',
            [id]
        );
        return row ? { userId: row.user_id, imageData: row.image_data } : null;
    }
}

export const imageDB = new ImageDatabase();