
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ref, set, push } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Product, ProductType, QuantityType } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import ProductTypeCombobox from './product-type-combobox';
import QuantityCombobox from './quantity-combobox';
import { ScrollArea } from './ui/scroll-area';

const formSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1, 'Product name is required.'),
  type: z.string().min(1, 'Product type is required.'),
  quantity: z.string().min(1, 'Quantity is required.'),
  retailRate: z.coerce.number().min(0, 'Retail rate must be a positive number.'),
  wholesaleRate: z.coerce.number().min(0, 'Wholesale rate must be a positive number.'),
  purchaseRate: z.coerce.number().min(0, 'Purchase rate must be a positive number.'),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  productTypes: ProductType[];
  quantityTypes: QuantityType[];
}

export default function ProductForm({ isOpen, setIsOpen, product, productTypes, quantityTypes }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newProductType, setNewProductType] = useState('');
  const [showNewQuantityInput, setShowNewQuantityInput] = useState(false);
  const [newQuantity, setNewQuantity] = useState('');
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: '',
      name: '',
      type: '',
      quantity: '',
      retailRate: 0,
      wholesaleRate: 0,
      purchaseRate: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(product);
      if (product.type === 'Other') {
        setShowNewTypeInput(true);
      } else {
        setShowNewTypeInput(false);
      }
      setShowNewQuantityInput(false);
    } else {
      form.reset({
        productId: '',
        name: '',
        type: '',
        quantity: '',
        retailRate: 0,
        wholesaleRate: 0,
        purchaseRate: 0,
      });
      setShowNewTypeInput(false);
      setShowNewQuantityInput(false);
    }
    setNewProductType('');
    setNewQuantity('');
  }, [product, isOpen, form]);
  
  const handleTypeChange = (value: string) => {
    form.setValue('type', value);
    if (value.toLowerCase() === 'other') {
      setShowNewTypeInput(true);
    } else {
      setShowNewTypeInput(false);
      setNewProductType('');
    }
  }

  const handleQuantityChange = (value: string) => {
    form.setValue('quantity', value);
    if (value.toLowerCase() === 'other') {
      setShowNewQuantityInput(true);
    } else {
      setShowNewQuantityInput(false);
      setNewQuantity('');
    }
  }

  const onSubmit = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    let finalValues = { ...values };

    try {
      if (finalValues.type?.toLowerCase() === 'other') {
        if (!newProductType.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'New product type cannot be empty.' });
            setIsSubmitting(false);
            return;
        }
        
        const typesRef = ref(db, 'productTypes');
        const newTypeRef = push(typesRef);
        await set(newTypeRef, { name: newProductType });
        finalValues.type = newProductType;
      }
      
      if (finalValues.quantity?.toLowerCase() === 'other') {
        if (!newQuantity.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'New quantity cannot be empty.' });
            setIsSubmitting(false);
            return;
        }
        
        const quantitiesRef = ref(db, 'quantityTypes');
        const newQuantityRef = push(quantitiesRef);
        await set(newQuantityRef, { name: newQuantity });
        finalValues.quantity = newQuantity;
      }

      const productRef = product ? ref(db, `products/${product.id}`) : push(ref(db, 'products'));
      await set(productRef, finalValues);

      toast({
        title: 'Success!',
        description: `Product ${product ? 'updated' : 'added'} successfully.`,
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of your product.' : 'Fill in the details to add a new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="product-form" className="flex flex-col h-full overflow-hidden">
            <ScrollArea className="pr-6 -mr-6 flex-1">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product ID (Optional)</FormLabel>
                      <FormControl><Input placeholder="e.g., SKU-12345" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl><Input placeholder="e.g., Whole Milk" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Product Type</FormLabel>
                      <ProductTypeCombobox
                        productTypes={productTypes}
                        value={field.value}
                        onChange={handleTypeChange}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {showNewTypeInput && (
                  <FormItem>
                    <FormLabel>New Product Type Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the new type"
                        value={newProductType}
                        onChange={(e) => setNewProductType(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}
                <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Quantity</FormLabel>
                        <QuantityCombobox
                          quantityTypes={quantityTypes}
                          value={field.value}
                          onChange={handleQuantityChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                {showNewQuantityInput && (
                  <FormItem>
                    <FormLabel>New Quantity Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the new quantity"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}
                <FormField
                  control={form.control}
                  name="purchaseRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Rate</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="retailRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retail Rate</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wholesaleRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wholesale Rate</FormLabel>
                      <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" form="product-form" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {product ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
