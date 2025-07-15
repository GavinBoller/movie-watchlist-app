// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Edit, Trash2, X, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Platform } from '../types';

interface PlatformForm {
  name: string;
  logoUrl: string;
  isDefault: boolean;
}

interface PlatformManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlatformManagementModal({ isOpen, onClose }: PlatformManagementModalProps): React.ReactElement | null {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [newPlatform, setNewPlatform] = useState<PlatformForm>({ name: '', logoUrl: '', isDefault: false });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlatform, setEditPlatform] = useState<PlatformForm>({ name: '', logoUrl: '', isDefault: false });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPlatforms();
    }
  }, [isOpen]);

  // Effect to handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchPlatforms = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/platforms`); // userId no longer needed in query
      if (!res.ok) throw new Error('Failed to fetch platforms');
      const data = await res.json();
      // Map is_default (API) to isDefault (UI)
      const mapped = data.map((p: any) => ({
        ...p,
        isDefault: p.is_default,
        logoUrl: p.logo_url || '',
      }));
      setPlatforms(mapped.sort((a, b) => a.name.localeCompare(b.name)));
      setError('');
    } catch (err: any) {
      setError('Failed to load platforms');
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to load platforms',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlatform = async (): Promise<void> => {
    if (!newPlatform.name.trim()) {
      setError('Platform name is required');
      return;
    }
    try {
      const res = await fetch('/api/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlatform), // userId removed from payload
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to add platform');
      }
      const platform = await res.json();
      const mapped = {
        ...platform,
        isDefault: platform.is_default,
        logoUrl: platform.logo_url || '',
      };
      setPlatforms([...platforms, mapped].sort((a, b) => a.name.localeCompare(b.name)));
      setNewPlatform({ name: '', logoUrl: '', isDefault: false });
      setError('');
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Platform added successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setError(err.message);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleEditPlatform = async (): Promise<void> => {
    if (!editPlatform.name.trim()) {
      setError('Platform name is required');
      return;
    }
    try {
      const res = await fetch('/api/platforms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editPlatform }), // userId removed from payload
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update platform');
      }
      const updatedPlatform = await res.json();
      const mapped = {
        ...updatedPlatform,
        isDefault: updatedPlatform.is_default,
        logoUrl: updatedPlatform.logo_url || '',
      };
      setPlatforms(
        platforms
          .map((p) => (p.id === editingId ? mapped : p))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      setEditPlatform({ name: '', logoUrl: '', isDefault: false });
      setError('');
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Platform updated successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setError(err.message);
      addToast({
        id: Date.now(),
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlatform = async (id: number): Promise<void> => {
    try {
      const res = await fetch('/api/platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }), // API will use session to verify user
      });
      if (!res.ok) throw new Error('Failed to delete platform');
      setPlatforms(platforms.filter((p) => p.id !== id));
      addToast({
        id: Date.now(),
        title: 'Success',
        description: 'Platform deleted successfully',
        variant: 'success'
      });
    } catch (err: any) {
      setError('Failed to delete platform');
      addToast({
        id: Date.now(),
        title: 'Error',
        description: 'Failed to delete platform',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full">
          <p className="text-gray-400">Loading platforms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-4">Manage Streaming Platforms</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-6">
          {platforms.length === 0 ? (
            <p className="text-gray-400">No platforms added yet.</p>
          ) : (
            <ul className="space-y-2">
              {platforms.map((platform) => (
                <li
                  key={platform.id}
                  className="flex items-center justify-between bg-gray-800 p-3 rounded-lg"
                >
                  {editingId === platform.id ? (
                    <div className="flex-1">
                      <Input
                        value={editPlatform.name}
                        onChange={(e) => setEditPlatform({ ...editPlatform, name: e.target.value })}
                        placeholder="Platform name"
                        className="bg-gray-700 text-white border-gray-600 mb-2"
                      />
                      <Input
                        value={editPlatform.logoUrl}
                        onChange={(e) =>
                          setEditPlatform({ ...editPlatform, logoUrl: e.target.value })
                        }
                        placeholder="Logo URL (optional)"
                        className="bg-gray-700 text-white border-gray-600 mb-2"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editPlatform.isDefault}
                          onCheckedChange={(checked) =>
                            setEditPlatform({ ...editPlatform, isDefault: checked })
                          }
                        />
                        <span className="text-gray-300">Set as default</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button
                          onClick={handleEditPlatform}
                          className="bg-[#E50914] hover:bg-[#f6121d]"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                          className="text-gray-300 border-gray-600"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {platform.isDefault && (
                          <CheckCircle className="h-4 w-4 text-green-400" aria-label="Default platform" />
                        )}
                        <button
                          onClick={() => {
                            setEditingId(platform.id);
                            setEditPlatform({
                              name: platform.name,
                              logoUrl: platform.logoUrl || '',
                              isDefault: platform.isDefault || false,
                            });
                          }}
                          className="text-gray-400 hover:text-white"
                          aria-label="Edit platform"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlatform(platform.id)}
                          className="text-red-500 hover:text-red-400"
                          aria-label="Delete platform"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Add New Platform</h3>
          <Input
            value={newPlatform.name}
            onChange={(e) => setNewPlatform({ ...newPlatform, name: e.target.value })}
            placeholder="Platform name"
            className="bg-gray-700 text-white border-gray-600"
          />
          <Input
            value={newPlatform.logoUrl}
            onChange={(e) => setNewPlatform({ ...newPlatform, logoUrl: e.target.value })}
            placeholder="Logo URL (optional)"
            className="bg-gray-700 text-white border-gray-600"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={newPlatform.isDefault}
              onCheckedChange={(checked) =>
                setNewPlatform({ ...newPlatform, isDefault: checked })
              }
            />
            <span className="text-gray-300">Set as default</span>
          </div>
          <Button
            onClick={handleAddPlatform}
            className="w-full bg-[#E50914] hover:bg-[#f6121d]"
          >
            Add Platform
          </Button>
        </div>
      </div>
    </div>
  );
}