const archiver = require('archiver');
const fs = require('fs-extra');

function createArchive(options = { zlib: { level: 9 } }) {
  if (typeof archiver === 'function') {
    return archiver('zip', options);
  }
  if (archiver.ZipArchive) {
    return new archiver.ZipArchive(options);
  }
  if (archiver.default && typeof archiver.default === 'function') {
    return archiver.default('zip', options);
  }
  if (archiver.default && archiver.default.ZipArchive) {
    return new archiver.default.ZipArchive(options);
  }
  throw new Error('Unable to initialize zip archive stream from archiver library');
}

/**
 * Streams directory as a zip to an HTTP Express response object.
 * Cleans up temp directory after stream finishes.
 */
function streamZip(sourceDir, zipFileName, res, tempDirToClean) {
  try {
    const archive = createArchive({ zlib: { level: 9 } });

    res.attachment(`${zipFileName}.zip`);
    res.setHeader('Content-Type', 'application/zip');

    archive.on('error', async (err) => {
      console.error('ZIP ARCHIVE ERROR:', err);
      if (tempDirToClean) await fs.remove(tempDirToClean).catch(() => {});
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to archive generated project' });
      }
    });

    res.on('finish', async () => {
      if (tempDirToClean) {
        await fs.remove(tempDirToClean).catch(() => {});
      }
    });

    archive.pipe(res);
    archive.directory(sourceDir, zipFileName);
    archive.finalize().catch((err) => {
      console.error('FINALIZE ERROR:', err);
      if (tempDirToClean) fs.remove(tempDirToClean).catch(() => {});
    });
  } catch (err) {
    console.error('STREAM ZIP CREATION ERROR:', err);
    if (tempDirToClean) fs.remove(tempDirToClean).catch(() => {});
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Archive initialization error: ' + err.message });
    }
  }
}

module.exports = { streamZip };
