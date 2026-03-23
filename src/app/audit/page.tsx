"use client";

import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AuditRecord } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, []);

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
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">Detailed history of all product activities.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle>Change History</CardTitle>
          </div>
          <CardDescription>
            A record of creations, updates, and deletions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No audit records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Product ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
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
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {audit.productName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {audit.productType}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getBadgeVariant(audit.action)}>
                          {audit.action.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-[200px]">
                          {audit.action === 'create' && (
                            <span className="text-xs text-muted-foreground italic">New Product Added</span>
                          )}
                          {audit.action === 'delete' && (
                            <span className="text-xs text-muted-foreground italic">Product Removed</span>
                          )}
                          {audit.action === 'update' && audit.changes?.map((change, i) => (
                            <div key={i} className="text-xs border-b border-border/50 pb-1 last:border-0 last:pb-0">
                              <span className="font-semibold text-foreground/70">{change.field}:</span>{' '}
                              <span className="text-muted-foreground line-through decoration-destructive/50">{formatValue(change.field, change.oldValue)}</span>
                              {' → '}
                              <span className="text-primary font-bold">{formatValue(change.field, change.newValue)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
