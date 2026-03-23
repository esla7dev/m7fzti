import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/api/services/walletService';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useWallets(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.wallets(userId),
    queryFn: () => walletService.getAll(userId),
    enabled: !!userId,
  });
}

export function useCreateWallet(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletData) => walletService.create(userId, walletData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}

export function useUpdateWallet(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ walletId, data }) => walletService.update(walletId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}

export function useDeleteWallet(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletId) => walletService.delete(walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wallets(userId) });
    },
  });
}
