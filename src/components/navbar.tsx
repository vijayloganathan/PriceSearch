import { Package, Plus, Settings } from 'lucide-react';
import { Button } from './ui/button';

interface NavbarProps {
  onAddProduct?: () => void;
  onManageCategories?: () => void;
  isMobile: boolean;
}

export default function Navbar({ onAddProduct, onManageCategories, isMobile }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FindPrice</span>
        </div>
        <div className="flex items-center gap-2">
           {isMobile ? (
             <>
                <Button onClick={onManageCategories} variant="default" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
                <Button onClick={onAddProduct} variant="default" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
             </>
           ) : (
            <>
              <Button onClick={onManageCategories} variant="outline">
                <Settings className="mr-2 h-4 w-4" /> Manage Categories
              </Button>
              <Button onClick={onAddProduct}>
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </>
           )}
        </div>
      </div>
    </header>
  );
}
