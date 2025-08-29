
"use client";

import { useState, useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { ProductType, QuantityType } from '@/types';
import { cn } from '@/lib/utils';

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

type Item = { id: string; name: string; type: 'productType' | 'quantityType' };
type ItemToEdit = Item | null;
type ItemToDelete = Item | null;

export default function ManageCategoriesDialog({
  isOpen,
  setIsOpen,
  productTypes,
  quantityTypes,
}: ManageCategoriesDialogProps) {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<ItemToEdit>(null);
  const [editedName, setEditedName] = useState('');
  const [itemToDelete, setItemToDelete] = useState<ItemToDelete>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset states when dialog is closed or opened
    if (!isOpen) {
      setSelectedItem(null);
      setEditingItem(null);
      setItemToDelete(null);
      setEditedName('');
    }
  }, [isOpen]);


  const handleEditClick = () => {
    if (!selectedItem) return;
    setEditingItem(selectedItem);
    setEditedName(selectedItem.name);
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
      setSelectedItem(null); // Deselect after saving
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update item.' });
    }
  };
  
  const handleDeleteClick = () => {
     if (!selectedItem) return;
    setItemToDelete(selectedItem);
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
        setSelectedItem(null); // Deselect after deleting
    }
  };

  const renderList = (items: { id: string; name: string }[], type: 'productType' | 'quantityType') => (
    <ul className="space-y-2">
      {items.map((item) => {
        const fullItem = { ...item, type };
        return (
          <li key={item.id}>
             {editingItem?.id === item.id ? (
                <div className="flex-1 flex items-center gap-2 p-2">
                    <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}><Check className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}><X className="h-4 w-4" /></Button>
                </div>
            ) : (
                <button 
                    className={cn(
                        "w-full text-left p-2 rounded-md transition-colors",
                        selectedItem?.id === item.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"
                    )}
                    onClick={() => setSelectedItem(fullItem)}
                >
                    {item.name}
                </button>
            )}
          </li>
        )
      })}
    </ul>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogDescription>
              Select a category to edit or delete it.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 -mr-4 pr-4">
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
          
          <DialogFooter className="mt-auto pt-4 border-t">
              {selectedItem && !editingItem && (
                 <div className="w-full flex justify-between items-center">
                    <p className="text-sm font-medium truncate pr-4">
                        Selected: <span className="text-primary">{selectedItem.name}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleEditClick}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={handleDeleteClick}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </div>
              )}
               {(!selectedItem || editingItem) && (
                 <div className="w-full flex justify-end">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                 </div>
               )}
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
