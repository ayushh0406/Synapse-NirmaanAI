import { FC } from 'react';
import { cn } from '@/lib/utils';
import { FolderIcon, FileIcon } from 'lucide-react';

interface FileExplorerProps {
  files: { path: string; content: string; language: string }[];
  currentFile: string;
  onSelectFile: (path: string) => void;
}

export const FileExplorer: FC<FileExplorerProps> = ({ files, currentFile, onSelectFile }) => {
  // Group files by directories
  const fileTree = files.reduce((acc, file) => {
    const parts = file.path.split('/');
    let current = acc;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const fileName = parts[parts.length - 1];
    current[fileName] = file;
    
    return acc;
  }, {});

  // Recursive function to render file tree
  const renderTree = (tree, path = '') => {
    return Object.entries(tree).map(([key, value]) => {
      const currentPath = path ? `${path}/${key}` : key;
      
      // If it's a file (has content property)
      if (value.content) {
        return (
          <div 
            key={currentPath}
            className={cn(
              "flex items-center py-1 px-2 cursor-pointer hover:bg-secondary",
              currentFile === value.path ? "bg-secondary" : ""
            )}
            onClick={() => onSelectFile(value.path)}
          >
            <FileIcon size={16} className="mr-2" />
            <span className="text-sm truncate">{key}</span>
          </div>
        );
      }
      
      // It's a directory
      return (
        <div key={currentPath} className="py-1">
          <div className="flex items-center px-2 font-medium">
            <FolderIcon size={16} className="mr-2" />
            <span className="text-sm">{key}</span>
          </div>
          <div className="ml-4">
            {renderTree(value, currentPath)}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-2 h-full overflow-auto">
      <h3 className="font-semibold mb-2">Files</h3>
      {renderTree(fileTree)}
    </div>
  );
};
