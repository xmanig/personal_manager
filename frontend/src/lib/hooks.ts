import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBills, updateBill, deleteBill, fetchBillsFromGmail, fetchBillsFromAllAccounts } from './bills-api';
import { fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent } from './calendar-api';
import { getAuthStatus, listAccounts } from './auth';

export function useBills() {
  return useQuery({ queryKey: ['bills'], queryFn: fetchBills });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateBill(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useFetchGmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rules, accountId }: { rules?: any; accountId?: string }) =>
      accountId === '__all__'
        ? fetchBillsFromAllAccounts(rules || { hasAttachment: true })
        : fetchBillsFromGmail(rules || { hasAttachment: true }, accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bills'] }),
  });
}

export function useCalendarEvents(from: Date, to: Date, accountId?: string) {
  return useQuery({
    queryKey: ['calendar-events', from.toISOString(), to.toISOString(), accountId],
    queryFn: () => fetchCalendarEvents(from, to, accountId),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createCalendarEvent>[0]) => createCalendarEvent(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCalendarEvent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['calendar-events'] }),
  });
}

export function useAuthStatus() {
  return useQuery({ queryKey: ['auth-status'], queryFn: getAuthStatus, staleTime: 30000 });
}

export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: listAccounts, staleTime: 30000 });
}
