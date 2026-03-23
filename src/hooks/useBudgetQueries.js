import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '@/api/services/budgetService';
import { QUERY_KEYS } from '@/lib/queryKeys';

export function useBudgets(userId) {
  return useQuery({
    queryKey: QUERY_KEYS.budgets(userId),
    queryFn: () => budgetService.getAll(userId),
    enabled: !!userId,
  });
}

export function useCreateBudget(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => budgetService.create(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets(userId) });
    },
  });
}

export function useUpdateBudget(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetId, data }) => budgetService.update(budgetId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets(userId) });
    },
  });
}

export function useDeleteBudget(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (budgetId) => budgetService.delete(budgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.budgets(userId) });
    },
  });
}
