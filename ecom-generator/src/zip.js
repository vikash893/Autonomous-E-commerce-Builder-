const archiver = require('archiver');

// Stream a directory as a zip into a writable (Express res). No full-buffer in memory.
function streamZip(res, dir, folderName, onDone) {
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${folderName}.zip"`);
  archive.on('error', (err) => { res.destroy(err); onDone && onDone(); });
  res.on('close', () => onDone && onDone());
  archive.pipe(res);
  archive.directory(dir, folderName);
  archive.finalize();
}

module.exports = { streamZip };
