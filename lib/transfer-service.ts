import { apiClient } from '@/lib/api-client';

export interface CreateTransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  reference?: string;
  description?: string;
}

export const transferService = {
  createTransfer: async (data: CreateTransferRequest): Promise<void> => {
    const response = await apiClient.post('/api/transfers', data);
    if (!response.success) {
      throw new Error(response.message || 'Transfer failed');
    }
  },
};
