import multer from 'multer';
import path from 'path';
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        serverName: string;
      }
    }
  }
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/tmp');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    file.serverName = filename;
    cb(null, filename);
  },
});

export const upload = multer({ storage: storage });
