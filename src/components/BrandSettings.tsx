import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Editor } from './Editor';
import { PreviewPane } from './PreviewPane';
import { generateProductCard } from '@/lib/ai';
import { Loader2, ClipboardCopy, Download } from 'lucide-react';

export function BrandSettings() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    colorTheme: 'blue',
    designPrompt: ''
  });
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      colorTheme: value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const code = await generateProductCard(formData);
      setGeneratedCode(code);
    } catch (error) {
      console.error('Error generating card:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };
  
  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], {type: 'text/javascript'});
    element.href = URL.createObjectURL(file);
    element.download = 'ProductCard.jsx';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Form card (left) */}
      <Card className="w-1/3 h-full overflow-y-auto">
        <CardContent className="pt-6">
          <h2 className="text-xl font-bold mb-6">Product Card Generator</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="Enter product name" 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Enter product description" 
                required 
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input 
                id="imageUrl" 
                name="imageUrl" 
                value={formData.imageUrl} 
                onChange={handleChange} 
                placeholder="https://example.com/image.jpg" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="colorTheme">Color Theme</Label>
              <Select value={formData.colorTheme} onValueChange={handleSelectChange}>
                <SelectTrigger id="colorTheme">
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="designPrompt">Design Instructions</Label>
              <Textarea 
                id="designPrompt" 
                name="designPrompt" 
                value={formData.designPrompt} 
                onChange={handleChange} 
                placeholder="Additional design instructions, e.g., 'Modern with rounded corners', 'Minimalist design', etc." 
                className="min-h-[100px]"
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Product Card'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* Code and Preview card (right) */}
      <Card className="w-2/3 h-full overflow-hidden">
        <Tabs defaultValue="code" className="w-full h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="code">Code</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="code" className="flex-1 p-4 pt-0 overflow-hidden">
            <div className="relative h-full flex flex-col">
              <div className="flex justify-end gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard} disabled={!generatedCode}>
                  <ClipboardCopy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadCode} disabled={!generatedCode}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="flex-1 overflow-hidden border rounded-md">
                <Editor
                  value={generatedCode || '// Your generated code will appear here'}
                  language="javascript"
                  readOnly={true}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="preview" 
            className="flex-1 p-4 pt-0 overflow-auto"
          >
            <PreviewPane code={generatedCode} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}