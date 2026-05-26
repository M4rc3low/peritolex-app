import { useQuery } from '@tanstack/react-query';
import { peritolexApi } from '@/api/peritolexClient';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => peritolexApi.auth.me(),
    staleTime: 5 * 60 * 1000,
  });
}
