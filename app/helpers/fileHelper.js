const fs = require('fs').promises;
const path = require('path');

exports.ensureUploadDir = async (uploadPath) => {
  try {
    await fs.access(uploadPath);
  } catch (error) {
    await fs.mkdir(uploadPath, { recursive: true });
  }
};

exports.generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  return `${timestamp}-${random}${extension}`;
};

exports.deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

exports.getFileStats = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    console.error('Error getting file stats:', error);
    return null;
  }
};