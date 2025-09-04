// src/components/services/ServiceModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Service } from '@/types';

interface ServiceModalProps {
  open: boolean;
  onClose: () => void;
  service?: Service | null; // If present, modal is in edit mode
  onSave: (data: { name: string; description?: string; price: number; duration: number; isActive?: boolean }) => void;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ open, onClose, service, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [duration, setDuration] = useState<number | ''>('');

  useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description || '');
      setPrice(service.price);
      setDuration(service.duration);
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setDuration('');
    }
  }, [service, open]);

  const handleSubmit = () => {
    if (!name || price === '' || duration === '') {
      alert('Please fill in all required fields');
      return;
    }
    onSave({
      name,
      description: description || undefined,
      price: Number(price),
      duration: Number(duration),
      isActive: true
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-bold">{service ? 'Edit Service' : 'Add Service'}</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Service Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Service description (optional)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Price ($)</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Duration (minutes)</label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{service ? 'Update' : 'Create'}</Button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceModal;
