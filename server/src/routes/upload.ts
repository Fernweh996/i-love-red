import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `fund-screenshot-${hash}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    res.json({
      filename,
      absolutePath: filePath,
    });
  } catch (err) {
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

    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export { router as uploadRouter };
