import { FC, useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Smartphone, Tablet, Monitor, Loader2, Code } from 'lucide-react';
import { exportProject } from '@/lib/api';
import { saveAs } from 'file-saver';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const PreviewPane: FC = () => {
  const { generatedFiles } = useStore();
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isExporting, setIsExporting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'iframe' | 'html'>('iframe');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadFilename, setDownloadFilename] = useState('synapse-ui-project');

  // Generate the preview whenever files change
  useEffect(() => {
    if (!generatedFiles || generatedFiles.length === 0) return;
    generatePreview();
  }, [generatedFiles, previewMode]);

  // Generate a preview based on the files
  const generatePreview = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (previewMode === 'iframe') {
        await generateIframePreview();
      } else {
        generateHtmlPreview();
      }
    } catch (err) {
      console.error("Preview generation error:", err);
      setError(`Failed to generate preview: ${err.message}`);
      
      // Try fallback mode if current mode fails
      if (previewMode === 'iframe') {
        setPreviewMode('html');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate a preview using an iframe with srcdoc
  const generateIframePreview = async () => {
    if (!iframeRef.current) return;
    
    // Find necessary files
    const htmlFile = generatedFiles.find(f => f.path.includes('index.html')) || createDefaultHtmlFile();
    const cssFiles = generatedFiles.filter(f => f.path.endsWith('.css'));
    const appFile = generatedFiles.find(f => f.path.includes('App.jsx') || f.path.includes('App.tsx'));
    
    if (!appFile) {
      throw new Error('App file not found in generated code');
    }
    
    // Create a full HTML document
    const cssContent = cssFiles.map(file => `<style>${file.content}</style>`).join('\n');
    const tailwindCDN = `<script src="https://cdn.tailwindcss.com"></script>`;
    const reactCDN = `
      <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
      <script src="https://unpkg.com/babel-standalone@7/babel.min.js"></script>
    `;
    
    const mainScript = `
      <script type="text/babel">
        ${appFile.content}
        
        // Render the App component
        const rootElement = document.getElementById('root');
        ReactDOM.createRoot(rootElement).render(
          <React.StrictMode>
            <App />
          </React.StrictMode>
        );
      </script>
    `;
    
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Generated UI Preview</title>
        ${tailwindCDN}
        ${cssContent}
        ${reactCDN}
      </head>
      <body>
        <div id="root"></div>
        ${mainScript}
      </body>
      </html>
    `;
    
    // Apply the HTML to the iframe
    iframeRef.current.srcdoc = fullHtml;
  };
  
  // Generate a simple HTML preview (fallback mode)
  const generateHtmlPreview = () => {
    if (!iframeRef.current) return;
    
    const htmlFile = generatedFiles.find(f => f.path.includes('index.html'));
    const cssFiles = generatedFiles.filter(f => f.path.endsWith('.css'));
    
    const cssContent = cssFiles.map(file => `<style>${file.content}</style>`).join('\n');
    const tailwindCDN = `<script src="https://cdn.tailwindcss.com"></script>`;
    
    // Create a simplified version with just HTML and CSS
    let htmlContent = (htmlFile?.content || '<!DOCTYPE html><html><body><div id="root"></div></body></html>')
      .replace('</head>', `${tailwindCDN}${cssContent}</head>`);
    
    // Find UI components from files
    const componentFiles = generatedFiles.filter(f => 
      (f.path.includes('Component') || f.path.includes('components')) && 
      (f.path.endsWith('.jsx') || f.path.endsWith('.tsx'))
    );
    
    // Extract HTML-like content from components
    let componentContent = '';
    for (const file of componentFiles) {
      // Extract JSX return statements and convert to HTML-like syntax
      const jsxMatches = file.content.match(/return\s*\(\s*<[^>]*>([\s\S]*?)<\/[^>]*>\s*\)/g);
      if (jsxMatches && jsxMatches.length) {
        const jsx = jsxMatches[0]
          .replace(/return\s*\(\s*<[^>]*>/, '')
          .replace(/<\/[^>]*>\s*\)$/, '')
          .replace(/className=/g, 'class=')
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, ''); // Remove comments
          
        componentContent += `<div class="component">${jsx}</div>`;
      }
    }
    
    // Insert component content
    htmlContent = htmlContent.replace('<div id="root"></div>', `<div id="root">${componentContent || '<div class="p-4">Preview content</div>'}</div>`);
    
    iframeRef.current.srcdoc = htmlContent;
  };

  // Create a default HTML file
  const createDefaultHtmlFile = () => ({
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    language: 'html'
  });

  // Open download dialog
  const handleOpenDownloadDialog = () => {
    if (!generatedFiles.length) return;
    setShowDownloadDialog(true);
  };

  // Perform the actual download
  const downloadCode = async () => {
    if (!generatedFiles.length) return;

    setIsExporting(true);
    try {
      const blob = await exportProject(generatedFiles);
      saveAs(blob, `${downloadFilename}.zip`);
      setShowDownloadDialog(false);
    } catch (error) {
      console.error('Error exporting project:', error);
      setError(`Failed to export project: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getViewportClassName = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-[375px] mx-auto h-full';
      case 'tablet':
        return 'max-w-[768px] mx-auto h-full';
      case 'desktop':
      default:
        return 'w-full h-full';
    }
  };
  
  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(prev => prev === 'iframe' ? 'html' : 'iframe');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center p-2 border-b-[3px] border-black dark:border-white">
        <div className="text-lg font-bold">Preview</div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewportSize === 'mobile' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('mobile')}
            title="Mobile view"
            className="neobrutalist-border"
          >
            <Smartphone size={16} />
          </Button>
          <Button 
            variant={viewportSize === 'tablet' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('tablet')}
            title="Tablet view"
            className="neobrutalist-border"
          >
            <Tablet size={16} />
          </Button>
          <Button 
            variant={viewportSize === 'desktop' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewportSize('desktop')}
            title="Desktop view"
            className="neobrutalist-border"
          >
            <Monitor size={16} />
          </Button>
          <Button 
            variant={previewMode === 'html' ? 'default' : 'outline'}
            size="icon" 
            onClick={togglePreviewMode}
            title="Toggle preview mode"
          >
            <Code size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={generatePreview}
            disabled={isProcessing || !generatedFiles.length}
            title="Refresh preview"
            className="neobrutalist-border"
          >
            <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleOpenDownloadDialog} 
            disabled={!generatedFiles.length}
            title="Download code"
            className="neobrutalist-border"
          >
            <Download size={16} />
          </Button>
        </div>
      </div>
      
      <div className={`flex-1 overflow-hidden ${getViewportClassName()}`}>
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-muted-foreground">Preparing preview...</p>
          </div>
        ) : generatedFiles.length > 0 ? (
          <>
            {error && (
              <Alert variant="destructive" className="mb-2 neobrutalist-border">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="w-full h-full bg-white relative neobrutalist-border">
              <iframe 
                ref={iframeRef}
                className="w-full h-full border-0"
                title="UI Preview"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="neobrutalist-card p-6 bg-muted/30 rotate-1">
              <p className="font-bold">No preview available</p>
              <p className="text-muted-foreground mt-2">Enter a prompt to generate UI</p>
            </div>
          </div>
        )}
      </div>

      {/* Download Confirmation Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="neobrutalist-card">
          <DialogHeader>
            <DialogTitle>Download Project</DialogTitle>
            <DialogDescription>
              Enter a name for your project and click download to save it as a ZIP file.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="filename" className="block mb-2 font-bold">
              Project Name
            </Label>
            <Input 
              id="filename" 
              value={downloadFilename} 
              onChange={(e) => setDownloadFilename(e.target.value)}
              placeholder="Enter project name"
              className="w-full neobrutalist-input"
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="neobrutalist-border">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={downloadCode}
              disabled={isExporting || !downloadFilename.trim()}
              className="neobrutalist-button"
            >
              {isExporting ? (
                <><Loader2 size={16} className="animate-spin mr-2" /> Exporting...</>
              ) : (
                <><Download size={16} className="mr-2" /> Download</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};