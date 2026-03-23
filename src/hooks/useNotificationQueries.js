import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/api/services/notificationService';
import { QUERY_KEYS } from '@/lib/queryKeys';

const PAGE_SIZE = 20;

export function useNotifications(userId, offset = 0) {
  return useQuery({
    queryKey: [...QUERY_KEYS.notifications(userId), offset],
    queryFn: () => notificationService.getAll(userId, { limit: PAGE_SIZE, offset }),
    enabled: !!userId,
    refetchInterval: 60000,
    retry: 0,
  });
}

export function useNotificationCount(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.notificationCount(userId),
    queryFn: () => notificationService.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 60000,
    retry: 0,
  });
}

export function useMarkNotificationRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) => notificationService.markAsRead(userId, notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationCount(userId) });
    },
  });
}

export function useMarkAllNotificationsRead(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationCount(userId) });
    },
  });
}

export function useDeleteAllNotifications(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.deleteAll(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationCount(userId) });
    },
  });
}
