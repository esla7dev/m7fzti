import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistService } from '@/api/services/wishlistService';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useWishlist(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.wishlist(userId),
    queryFn: () => wishlistService.getAll(userId),
    enabled: !!userId,
  });
}

export function useCreateWishlistItem(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => wishlistService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist(userId) });
    },
  });
}

export function useUpdateWishlistItem(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }) => wishlistService.update(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist(userId) });
    },
  });
}

export function useDeleteWishlistItem(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId) => wishlistService.delete(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.wishlist(userId) });
    },
  });
}
