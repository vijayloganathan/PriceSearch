"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { ref, onValue, set, push, remove } from 'firebase/database';
import type { Product, ProductType, QuantityType } from '@/types';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Loader2, X, Settings } from 'lucide-react';
import ProductList from '@/components/product-list';
import ProductForm from '@/components/product-form';
import DeleteProductDialog from '@/components/delete-product-dialog';
import ManageCategoriesDialog from '@/components/manage-categories-dialog';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      setProducts(loadedProducts);
      setIsLoading(false);
    });

    const typesRef = ref(db, 'productTypes');
    const unsubscribeTypes = onValue(typesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedTypes: ProductType[] = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<ProductType, 'id'>),
          }))
        : [];
      setProductTypes(loadedTypes);
    });
    
    const quantityTypesRef = ref(db, 'quantityTypes');
    const unsubscribeQuantityTypes = onValue(quantityTypesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedQuantityTypes: QuantityType[] = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<QuantityType, 'id'>),
          }))
        : [];
      setQuantityTypes(loadedQuantityTypes);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeTypes();
      unsubscribeQuantityTypes();
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

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
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
        <div className="flex gap-2">
          {!isMobile && (
            <Button onClick={() => setIsCategoriesOpen(true)} variant="outline">
              <Settings className="mr-2 h-4 w-4" /> Manage Categories
            </Button>
          )}
          {!isMobile && (
            <Button onClick={handleAddProduct}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
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

      {isMobile && (
        <>
          <Button
            className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg"
            size="icon"
            onClick={() => setIsCategoriesOpen(true)}
            aria-label="Manage Categories"
            variant="outline"
          >
            <Settings className="h-7 w-7" />
          </Button>
          <Button
            className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
            size="icon"
            onClick={handleAddProduct}
            aria-label="Add Product"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </>
      )}

      <ProductForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        product={selectedProduct}
        productTypes={productTypes}
        quantityTypes={quantityTypes}
      />
      
      <ManageCategoriesDialog
        isOpen={isCategoriesOpen}
        setIsOpen={setIsCategoriesOpen}
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
