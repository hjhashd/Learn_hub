'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = '此操作无法撤销，请谨慎操作。'
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4">
        <Card className="border-red-200 dark:border-red-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">删除确认</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              您确定要删除 "<span className="font-semibold">{title}</span>" 吗？
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? '删除中...' : '删除'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}