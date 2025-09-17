
"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import type { Product, ProductType, QuantityType } from '@/types';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, X, Settings } from 'lucide-react';
import ProductList from '@/components/product-list';
import ProductForm from '@/components/product-form';
import DeleteProductDialog from '@/components/delete-product-dialog';
import ManageCategoriesDialog from '@/components/manage-categories-dialog';

interface HomeProps {
    productTypes: ProductType[];
    quantityTypes: QuantityType[];
    // These props are passed from layout but might be undefined if not needed.
    setIsFormOpen?: (open: boolean) => void;
    setIsCategoriesOpen?: (open: boolean) => void;
}

export default function Home({ productTypes, quantityTypes, setIsFormOpen: setFormOpenFromLayout, setIsCategoriesOpen: setCategoriesOpenFromLayout }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false); 
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const productsRef = ref(db, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedProducts: Product[] = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<Product, 'id'>),
          }))
        : [];
      
      // Sort products by productId
      loadedProducts.sort((a, b) => {
        if (!a.productId) return 1;
        if (!b.productId) return -1;
        return a.productId.localeCompare(b.productId);
      });

      setProducts(loadedProducts);
      setIsLoading(false);
    });
    
    return () => {
      unsubscribeProducts();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      Object.values(product).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [products, searchQuery]);

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    // Use the local form state for editing on this page
    setIsFormOpen(true);
  };

  const handleDeleteRequest = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await remove(ref(db, `products/${selectedProduct.id}`));
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete product.',
      });
    } finally {
      setIsDeleteAlertOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleSetFormOpen = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
        setSelectedProduct(null);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search by ID, name, price..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <ProductList
          products={filteredProducts}
          onEdit={handleEditProduct}
          onDelete={handleDeleteRequest}
        />
      )}
      
      {/* This form is controlled by the page's local state for editing */}
      <ProductForm
        isOpen={isFormOpen}
        setIsOpen={handleSetFormOpen}
        product={selectedProduct}
        productTypes={productTypes}
        quantityTypes={quantityTypes}
      />
      
      <DeleteProductDialog
        isOpen={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleConfirmDelete}
        productName={selectedProduct?.name || ''}
      />
    </div>
  );
}
