"use client";

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AuditRecord } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, History } from 'lucide-react';

interface AuditLogDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AuditLogDialog({ isOpen, onOpenChange }: AuditLogDialogProps) {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const auditsRef = ref(db, 'audits');
    const unsubscribe = onValue(auditsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedAudits: AuditRecord[] = data
        ? Object.entries(data).map(([key, value]) => ({
            id: key,
            ...(value as Omit<AuditRecord, 'id'>),
          }))
        : [];
      
      // Sort by latest first
      loadedAudits.sort((a, b) => b.timestamp - a.timestamp);
      setAudits(loadedAudits);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const getBadgeVariant = (action: string) => {
    switch (action) {
      case 'create': return 'default';
      case 'update': return 'secondary';
      case 'delete': return 'destructive';
      default: return 'outline';
    }
  };

  const formatValue = (field: string, value: any) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (field.toLowerCase().includes('rate')) {
      return formatCurrency(Number(value));
    }
    return String(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <DialogTitle>Audit Log</DialogTitle>
          </div>
          <DialogDescription>
            History of product changes and latest activities.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No audit logs found.
            </div>
          ) : (
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audits.map((audit) => (
                    <TableRow key={audit.id}>
                      <TableCell className="whitespace-nowrap text-xs font-mono">
                        {format(audit.timestamp, 'dd/MM HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{audit.productId || 'N/A'}</TableCell>
                      <TableCell className="max-w-[150px] truncate" title={audit.productName}>
                        {audit.productName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(audit.action)}>
                          {audit.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {audit.action === 'create' && (
                            <span className="text-xs text-muted-foreground italic">New Product Added</span>
                          )}
                          {audit.action === 'delete' && (
                            <span className="text-xs text-muted-foreground italic">Product Removed</span>
                          )}
                          {audit.action === 'update' && audit.changes?.map((change, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-semibold">{change.field}:</span>{' '}
                              <span className="text-muted-foreground line-through">{formatValue(change.field, change.oldValue)}</span>
                              {' → '}
                              <span className="text-primary font-medium">{formatValue(change.field, change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
