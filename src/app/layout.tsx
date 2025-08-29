"use client";

import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/navbar';
import './globals.css';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import ProductForm from '@/components/product-form';
import ManageCategoriesDialog from '@/components/manage-categories-dialog';

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
            {children}
          </main>
        </div>
        <Toaster />

        {/* These dialogs are now controlled from the layout to be accessible from the Navbar */}
        <ProductForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          product={null} // Simplified: Add-only from navbar
          productTypes={[]} // These need to be fetched or passed down
          quantityTypes={[]} // These need to be fetched or passed down
        />
      
        <ManageCategoriesDialog
            isOpen={isCategoriesOpen}
            setIsOpen={setIsCategoriesOpen}
            productTypes={[]} // These need to be fetched or passed down
            quantityTypes={[]} // These need to be fetched or passed down
        />
      </body>
    </html>
  );
}
