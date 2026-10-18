
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, path.resolve(process.cwd(), 'uploads'));
    },
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${randomUUID()}${extension}`);
    },
});

export const uploadMemeImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
            callback(new HttpError(400, 'Solo se permiten imágenes JPG, PNG o WebP.'));
            return;
        }

        callback(null, true);
    },
}).single('image');
