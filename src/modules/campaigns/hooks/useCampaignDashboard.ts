import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../app/providers/AuthProvider';
import { 
  campaignMetricsService, 
  DashboardMetrics, 
  LiveDispatchItem 
} from '../services/campaignMetricsService';
import { Campaign } from '../types/campaign.types';

export function useCampaignDashboard() {
  const { userData } = useAuth();
  const companyId = userData?.companyId || '';

  // 1. TanStack Query for Aggregated Historical Metrics
  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery<DashboardMetrics>({
    queryKey: ['campaignDashboardMetrics', companyId],
    queryFn: () => campaignMetricsService.getAggregatedMetrics(companyId),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    refetchOnWindowFocus: false
  });

  // 2. Firestore Real-time Listener for Live Feed (last 10 dispatches)
  const [liveFeed, setLiveFeed] = useState<LiveDispatchItem[]>([]);
  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = campaignMetricsService.subscribeToLiveFeed(
      companyId,
      (items) => setLiveFeed(items)
    );

    return () => unsubscribe();
  }, [companyId]);

  // 3. Firestore Real-time Listener for Active Campaigns progress
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = campaignMetricsService.subscribeToActiveCampaigns(
      companyId,
      (campaigns) => setActiveCampaigns(campaigns)
    );

    return () => unsubscribe();
  }, [companyId]);

  return {
    metrics,
    isLoading,
    isError,
    isFetching,
    refetch,
    liveFeed,
    activeCampaigns
  };
}
