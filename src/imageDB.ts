import { MemoryDB } from '@builderbot/bot';

interface ImageData {
    id: string;
    data: string;
    mimeType: string;
    timestamp: number;
}

export class ImageDatabase {
    private db: MemoryDB;
    private readonly IMAGE_PREFIX = 'img_';

    constructor(db: MemoryDB) {
        this.db = db;
    }

    async saveImage(imageBuffer: Buffer, mimeType: string = 'image/png'): Promise<string> {
        const id = `${this.IMAGE_PREFIX}${Date.now()}`;
        const imageData: ImageData = {
            id,
            data: imageBuffer.toString('base64'),
            mimeType,
            timestamp: Date.now()
        };

        await this.db.save(id, imageData);
        return id;
    }

    async getImage(id: string): Promise<ImageData | null> {
        const imageData = await this.db.find(id);
        return imageData as ImageData | null;
    }

    async deleteImage(id: string): Promise<void> {
        await this.db.delete(id);
    }
}