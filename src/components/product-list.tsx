"use client";

import { useState } from "react";
import type { Product } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Plus, Minus } from "lucide-react";

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function QuantityControl({ value, onChange }: { value: number; onChange: (newValue: number) => void; }) {
  const increment = () => onChange(value + 1);
  const decrement = () => onChange(Math.max(1, value - 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numValue = parseInt(e.target.value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      onChange(numValue);
    } else if (e.target.value === '') {
      onChange(1);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
      onChange(1);
    }
  };


  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={decrement} disabled={value <= 1}>
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        className="h-8 w-14 text-center"
        min="1"
      />
      <Button variant="outline" size="icon" className="h-8 w-8" onClick={increment}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}


export default function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const isMobile = useIsMobile();
  const [itemQuantities, setItemQuantities] = useState<{ [productId: string]: number }>({});

  const handleQuantityChange = (productId: string, quantity: number) => {
    const numQuantity = Math.max(1, quantity);
    setItemQuantities(prev => ({
      ...prev,
      [productId]: isNaN(numQuantity) ? 1 : numQuantity,
    }));
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <h3 className="text-xl font-semibold">No Products Found</h3>
        <p>Get started by adding a new product.</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const displayQuantity = itemQuantities[product.id] ?? 1;
          return (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{product.name}</CardTitle>
                        <CardDescription>{product.type}</CardDescription>
                    </div>
                    <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Product ID: <span className="font-medium text-foreground">{product.productId || 'N/A'}</span>
                </p>
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Quantity:</p>
                    <QuantityControl 
                      value={displayQuantity} 
                      onChange={(newVal) => handleQuantityChange(product.id, newVal)} 
                    />
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-sm">Purchase:</p>
                  <p className="font-semibold text-lg">{formatCurrency(product.purchaseRate * displayQuantity)}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unit: <span className="font-medium text-foreground">{product.quantity || 'N/A'}</span>
                </p>
                <div className="flex justify-between items-baseline">
                  <p className="text-sm">Retail:</p>
                  <p className={cn("font-semibold text-lg", "text-red-500")}>{formatCurrency(product.retailRate * displayQuantity)}</p>
                </div>
                <div className="flex justify-between items-baseline">
                  <p className="text-sm">Wholesale:</p>
                  <p className={cn("font-semibold text-lg", "text-green-600")}>{formatCurrency(product.wholesaleRate * displayQuantity)}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product ID</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[150px]">Quantity</TableHead>
            <TableHead className="text-right">Purchase Rate</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead className="text-right">Retail Rate</TableHead>
            <TableHead className="text-right">Wholesale Rate</TableHead>
            <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
             const displayQuantity = itemQuantities[product.id] ?? 1;
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.productId || 'N/A'}</TableCell>
                <TableCell className="font-semibold">{product.name}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell>
                  <QuantityControl 
                    value={displayQuantity} 
                    onChange={(newVal) => handleQuantityChange(product.id, newVal)} 
                  />
                </TableCell>
                <TableCell className="text-right">{formatCurrency(product.purchaseRate * displayQuantity)}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell className={cn("text-right", "text-red-500")}>{formatCurrency(product.retailRate * displayQuantity)}</TableCell>
                <TableCell className={cn("text-right", "text-green-600")}>{formatCurrency(product.wholesaleRate * displayQuantity)}</TableCell>
                <TableCell>
                  <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function ProductActions({ product, onEdit, onDelete }: { product: Product, onEdit: (p: Product) => void, onDelete: (p: Product) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(product)}>Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
