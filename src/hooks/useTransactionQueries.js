import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionService } from '@/api/services/transactionService';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useTransactions(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(userId),
    queryFn: () => transactionService.getAll(userId),
    enabled: !!userId,
  });
}

export function useRecentTransactions(userId, limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.transactionsRecent(userId),
    queryFn: () => transactionService.getRecent(userId, limit),
    enabled: !!userId,
  });
}

export function useCreateTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionData) => transactionService.create(userId, transactionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactionsRecent(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}

export function useUpdateTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, data }) => transactionService.update(transactionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactionsRecent(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}

export function useDeleteTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId) => transactionService.delete(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactionsRecent(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}
