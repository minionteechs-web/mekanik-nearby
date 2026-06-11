const fs = require('fs');
const path = require('path');

const useS3 = () => Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);

const getPublicUrl = (key) => {
    if (process.env.AWS_S3_PUBLIC_URL) {
        return `${process.env.AWS_S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    }
    const base = process.env.PUBLIC_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/${key}`;
};

const uploadLocal = (file, subdir) => {
    const filename = file.filename;
    const relativePath = `/uploads/${subdir}/${filename}`;
    return relativePath;
};

const deleteLocal = (urlPath) => {
    if (!urlPath?.startsWith('/uploads/')) return;
    const fullPath = path.join(__dirname, '../../', urlPath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

/** Upload file buffer — returns public URL path or key. Falls back to local multer path. */
const resolveUploadUrl = (req, file, subdir = '') => {
    if (!file) return null;
    if (subdir === 'avatars') {
        return `/uploads/avatars/${file.filename}`;
    }
    return `/uploads/${file.filename}`;
};

module.exports = {
    useS3,
    getPublicUrl,
    uploadLocal,
    deleteLocal,
    resolveUploadUrl,
};
