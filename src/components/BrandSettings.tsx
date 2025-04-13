import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/lib/store';

interface BrandSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandSettings({ open, onOpenChange }: BrandSettingsProps) {
  const { brandSettings, setBrandSettings } = useStore();

  const onDrop = useCallback((acceptedFiles: File[], type: 'logo' | 'productImage') => {
    const file = acceptedFiles[0];
    if (file) {
      setBrandSettings({ [type]: file });
    }
  }, [setBrandSettings]);

  const logoDropzone = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (files) => onDrop(files, 'logo'),
  });

  const productImageDropzone = useDropzone({
    accept: { 'image/*': [] },
    onDrop: (files) => onDrop(files, 'productImage'),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Brand Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Logo</Label>
            <div
              {...logoDropzone.getRootProps()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
            >
              <input {...logoDropzone.getInputProps()} />
              {brandSettings.logo ? (
                <p>Logo uploaded: {brandSettings.logo.name}</p>
              ) : (
                <p>Drop logo here or click to upload</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Image</Label>
            <div
              {...productImageDropzone.getRootProps()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary"
            >
              <input {...productImageDropzone.getInputProps()} />
              {brandSettings.productImage ? (
                <p>Image uploaded: {brandSettings.productImage.name}</p>
              ) : (
                <p>Drop product image here or click to upload</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Brand Font</Label>
            <Input
              value={brandSettings.font}
              onChange={(e) => setBrandSettings({ font: e.target.value })}
              placeholder="Enter font name"
            />
          </div>

          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={brandSettings.primaryColor}
                onChange={(e) => setBrandSettings({ primaryColor: e.target.value })}
                className="w-12 h-12 p-1"
              />
              <Input
                value={brandSettings.primaryColor}
                onChange={(e) => setBrandSettings({ primaryColor: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={brandSettings.secondaryColor}
                onChange={(e) => setBrandSettings({ secondaryColor: e.target.value })}
                className="w-12 h-12 p-1"
              />
              <Input
                value={brandSettings.secondaryColor}
                onChange={(e) => setBrandSettings({ secondaryColor: e.target.value })}
                placeholder="#000000"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}