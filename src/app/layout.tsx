
"use client";

import React, { useState, useEffect } from 'react';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/navbar';
import './globals.css';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductForm from '@/components/product-form';
import ManageCategoriesDialog from '@/components/manage-categories-dialog';
import { onValue, ref } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { ProductType, QuantityType } from '@/types';

// Note: Metadata is not supported in client components.
// If you need to set metadata, you'll need to move this to a server component.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isMobile = useIsMobile();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [quantityTypes, setQuantityTypes] = useState<QuantityType[]>([]);

  useEffect(() => {
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
      unsubscribeTypes();
      unsubscribeQuantityTypes();
    };
  }, []);

  const handleAddProduct = () => {
    // We'll need to pass a setter for the selected product if we want to edit from here.
    // For now, it only handles adding.
    setIsFormOpen(true);
  };

  const handleManageCategories = () => {
    setIsCategoriesOpen(true);
  };
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FindPrice</title>
        <meta name="description" content="Manage and find product prices easily." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="relative flex min-h-screen w-full flex-col">
          <Navbar 
            isMobile={isMobile}
            onAddProduct={handleAddProduct}
            onManageCategories={handleManageCategories}
          />
          <main className="flex-1">
            {React.Children.map(children, child => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, { 
                    productTypes, 
                    quantityTypes,
                    // Pass the setters to the page component
                    setIsFormOpen,
                    setIsCategoriesOpen,
                 });
              }
              return child;
            })}
          </main>
        </div>
        <Toaster />

        {/* These dialogs are now controlled from the layout to be accessible from the Navbar */}
        <ProductForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          product={null} // Simplified: Add-only from navbar
          productTypes={productTypes}
          quantityTypes={quantityTypes}
        />
      
        <ManageCategoriesDialog
            isOpen={isCategoriesOpen}
            setIsOpen={setIsCategoriesOpen}
            productTypes={productTypes}
            quantityTypes={quantityTypes}
        />
      </body>
    </html>
  );
}
