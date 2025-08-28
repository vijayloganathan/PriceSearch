"use client";

import { useState } from 'react';
import { ref, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { ProductType, QuantityType } from '@/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Trash2, Check, X } from 'lucide-react';
import { Separator } from './ui/separator';

interface ManageCategoriesDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  productTypes: ProductType[];
  quantityTypes: QuantityType[];
}

type ItemToEdit = { id: string; name: string; type: 'productType' | 'quantityType' } | null;
type ItemToDelete = { id: string; name: string; type: 'productType' | 'quantityType' } | null;

export default function ManageCategoriesDialog({
  isOpen,
  setIsOpen,
  productTypes,
  quantityTypes,
}: ManageCategoriesDialogProps) {
  const [editingItem, setEditingItem] = useState<ItemToEdit>(null);
  const [editedName, setEditedName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);
  const { toast } = useToast();

  const handleEditClick = (item: { id: string; name: string }, type: 'productType' | 'quantityType') => {
    setEditingItem({ ...item, type });
    setEditedName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditedName('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editedName.trim()) return;

    const dbPath = editingItem.type === 'productType' ? 'productTypes' : 'quantityTypes';
    try {
      await set(ref(db, `${dbPath}/${editingItem.id}`), { name: editedName.trim() });
      toast({ title: 'Success', description: 'Item updated successfully.' });
      handleCancelEdit();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update item.' });
    }
  };
  
  const handleDeleteClick = (item: { id: string; name: string }, type: 'productType' | 'quantityType') => {
    setItemToDelete({ ...item, type });
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const dbPath = itemToDelete.type === 'productType' ? 'productTypes' : 'quantityTypes';
    try {
      await remove(ref(db, `${dbPath}/${itemToDelete.id}`));
      toast({ title: 'Success', description: 'Item deleted successfully.' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
        setItemToDelete(null);
    }
  };

  const renderList = (items: { id: string; name: string }[], type: 'productType' | 'quantityType') => (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
          {editingItem?.id === item.id ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="h-8"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}><Check className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
            </div>
          ) : (
            <>
              <span className="flex-1">{item.name}</span>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditClick(item, type)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(item, type)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Edit or delete your existing product and quantity types.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4 -mr-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Product Types</h3>
                  {renderList(productTypes, 'productType')}
                </div>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-2">Quantity Types</h3>
                  {renderList(quantityTypes, 'quantityType')}
                </div>
              </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the category "{itemToDelete?.name}". Products using this category will not be changed.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                      Delete
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
