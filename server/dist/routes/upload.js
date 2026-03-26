"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
exports.uploadRouter = router;
// Ensure uploads directory exists
const uploadsDir = path_1.default.resolve(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// POST / — receive base64 image, save to uploads/, return filename + absolutePath
router.post('/', (req, res, next) => {
    try {
        const { image } = req.body;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ error: '缺少 image 字段' });
        }
        // Parse data URL: data:image/png;base64,xxxx
        const match = image.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/);
        if (!match) {
            return res.status(400).json({ error: '无效的图片格式，请上传 JPG/PNG/WebP 图片' });
        }
        const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        // Generate unique filename
        const hash = crypto_1.default.randomBytes(8).toString('hex');
        const filename = `fund-screenshot-${hash}.${ext}`;
        const filePath = path_1.default.join(uploadsDir, filename);
        fs_1.default.writeFileSync(filePath, buffer);
        res.json({
            filename,
            absolutePath: filePath,
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /:filename — delete uploaded file
router.delete('/:filename', (req, res, next) => {
    try {
        const { filename } = req.params;
        // Sanitize: only allow expected filename pattern
        if (!/^fund-screenshot-[a-f0-9]+\.(jpg|png|gif|webp)$/.test(filename)) {
            return res.status(400).json({ error: '无效的文件名' });
        }
        const filePath = path_1.default.join(uploadsDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=upload.js.map