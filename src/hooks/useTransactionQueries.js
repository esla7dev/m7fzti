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
    queryKey: QUERY_KEYS.transactionsRecent(userId, limit),
    queryFn: () => transactionService.getRecent(userId, limit),
    enabled: !!userId,
  });
}

export function useMonthlyTransactions(userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return useQuery({
    queryKey: QUERY_KEYS.transactionsMonthly(userId, year, month),
    queryFn: () => transactionService.getByMonth(userId, year, month),
    enabled: !!userId,
  });
}

function invalidateAllTransactionQueries(queryClient, userId) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactions(userId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.transactionsRecent(userId) });
  queryClient.invalidateQueries({ queryKey: ['transactions_monthly', userId] });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets(userId) });
}

export function useCreateTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionData, fee }) => transactionService.createAtomic(userId, transactionData, fee),
    onSuccess: () => invalidateAllTransactionQueries(queryClient, userId),
  });
}

export function useUpdateTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) => transactionService.updateAtomic(userId, params),
    onSuccess: () => invalidateAllTransactionQueries(queryClient, userId),
  });
}

export function useDeleteTransaction(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, fee }) => transactionService.deleteAtomic(userId, transactionId, fee),
    onSuccess: () => invalidateAllTransactionQueries(queryClient, userId),
  });
}
