import { useState } from 'react';

function TreeNode({ item, level = 0 }) {
  const [open, setOpen] = useState(true);
  const isFolder = item.children && item.children.length > 0;

  return (
    <div className="tree-node">
      <div
        className={`tree-row ${isFolder ? 'tree-folder' : 'tree-file'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder && setOpen(!open)}
      >
        <span className="tree-icon">
          {isFolder ? (open ? '📂' : '📁') : getFileIcon(item.name)}
        </span>
        <span className="tree-name">{item.name}</span>
        {isFolder && <span className="tree-arrow">{open ? '▾' : '▸'}</span>}
      </div>

      {isFolder && open && (
        <div className="tree-children">
          {item.children.map((child) => (
            <TreeNode key={child.path} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function getFileIcon(fileName) {
  if (fileName.endsWith('.jsx') || fileName.endsWith('.js')) return '📜';
  if (fileName.endsWith('.json')) return '⚙️';
  if (fileName.endsWith('.css')) return '🎨';
  if (fileName.endsWith('.md')) return '📝';
  if (fileName.includes('env')) return '🔑';
  return '📄';
}

function convertFlatPathsToTree(paths = []) {
  const root = { name: 'root', path: '', children: [] };

  for (const filePath of paths) {
    const parts = filePath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLeaf = i === parts.length - 1;
      const subPath = parts.slice(0, i + 1).join('/');

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: subPath,
          children: isLeaf ? null : [],
        };
        current.children.push(existing);
      }
      current = existing;
    }
  }

  // Sort folders before files
  const sortTree = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        const aIsFolder = !!a.children;
        const bIsFolder = !!b.children;
        if (aIsFolder === bIsFolder) return a.name.localeCompare(b.name);
        return aIsFolder ? -1 : 1;
      });
      node.children.forEach(sortTree);
    }
  };

  sortTree(root);
  return root.children;
}

export default function FileTreePreview({ fileList = [], envKeys = [] }) {
  const treeData = convertFlatPathsToTree(fileList);

  return (
    <div className="filetree-preview-panel">
      <div className="filetree-header">
        <div className="filetree-title">
          <span className="filetree-icon">⚡</span>
          <span>GENERATED CODEBASE PREVIEW</span>
        </div>
        <span className="filetree-count">{fileList.length} files</span>
      </div>

      <div className="filetree-body">
        {fileList.length === 0 ? (
          <p className="filetree-empty">Select modules to preview the generated project structure.</p>
        ) : (
          <div className="filetree-list">
            {treeData.map((node) => (
              <TreeNode key={node.path} item={node} level={0} />
            ))}
          </div>
        )}
      </div>

      {envKeys.length > 0 && (
        <div className="filetree-env-footer">
          <span className="env-heading">🔑 REQUIRED .ENV VARIABLES ({envKeys.length})</span>
          <div className="env-keys-list">
            {envKeys.map((k) => (
              <code key={k} className="env-chip">
                {k}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}