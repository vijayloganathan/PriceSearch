"use client";

import { useState, useEffect, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { AuditRecord } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';
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
import { Loader2, History, ArrowLeft, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const isMobile = useIsMobile();

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

  const uniqueTypes = useMemo(() => {
    const types = new Set(audits.map(a => a.productType).filter(Boolean));
    return Array.from(types).sort();
  }, [audits]);

  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      const matchAction = actionFilter === 'all' || audit.action === actionFilter;
      const matchType = typeFilter === 'all' || audit.productType === typeFilter;
      return matchAction && matchType;
    });
  }, [audits, actionFilter, typeFilter]);

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

  const resetFilters = () => {
    setActionFilter('all');
    setTypeFilter('all');
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
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

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
            <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[130px] h-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 border-0 bg-transparent focus:ring-0">
                <SelectValue placeholder="Product Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(actionFilter !== 'all' || typeFilter !== 'all') && (
              <Button variant="ghost" size="icon" onClick={resetFilters} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredAudits.length === 0 ? (
        <Card className="p-20 text-center text-muted-foreground">
          No audit records found matching your filters.
        </Card>
      ) : isMobile ? (
        <div className="space-y-4">
          {filteredAudits.map((audit) => (
            <Card key={audit.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{audit.productName}</CardTitle>
                    <CardDescription className="text-xs flex flex-wrap gap-x-2">
                      <span className="font-mono text-primary/70">{audit.productId || 'No ID'}</span>
                      <span>•</span>
                      <span>{audit.productType}</span>
                    </CardDescription>
                  </div>
                  <Badge variant={getBadgeVariant(audit.action)} className="uppercase text-[10px]">
                    {audit.action}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="text-[10px] text-muted-foreground font-mono">
                  {format(audit.timestamp, 'dd MMM yyyy, HH:mm:ss')}
                </div>
                
                <div className="bg-muted/30 rounded-md p-2 space-y-1.5">
                  {audit.action === 'create' && (
                    <span className="text-xs italic text-muted-foreground">New product added to inventory</span>
                  )}
                  {audit.action === 'delete' && (
                    <span className="text-xs italic text-muted-foreground">Product removed from system</span>
                  )}
                  {audit.action === 'update' && (audit.changes || []).length > 0 ? (
                    audit.changes?.map((change, i) => (
                      <div key={i} className="text-xs grid grid-cols-[80px_1fr] gap-2 border-b border-border/20 last:border-0 pb-1 last:pb-0">
                        <span className="font-semibold text-foreground/60">{change.field}:</span>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-muted-foreground line-through decoration-destructive/30">{formatValue(change.field, change.oldValue)}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-bold">{formatValue(change.field, change.newValue)}</span>
                        </div>
                      </div>
                    ))
                  ) : audit.action === 'update' && (
                    <span className="text-xs italic text-muted-foreground">Updated without field changes</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
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
                  {filteredAudits.map((audit) => (
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}