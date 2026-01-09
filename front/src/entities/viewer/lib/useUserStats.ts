import { useState, useEffect, useCallback } from 'react';
import type { UserStats } from '../../../shared/api/game';
import { useViewerStore } from '../model/store';

export const useUserStats = () => {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const viewerId = useViewerStore((state) => state.id);

    const fetchStats = useCallback(async () => {
        if (!viewerId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : '';
        
        try {
            const response = await fetch(`${baseUrl}/api/stats/${viewerId}`);
            if (response.ok) {
                const data = await response.json();
                setStats({
                    totalGames: data.totalGames,
                    wins: data.wins,
                    totalTurnover: data.totalTurnover,
                    bestHand: data.bestHand || '—'
                });
            } else {
                console.error("Failed to fetch user stats");
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsLoading(false);
        }
    }, [viewerId]);

    useEffect(() => {
        if (viewerId) {
            fetchStats();
        }
    }, [fetchStats, viewerId]);

    return { stats, isLoading, refresh: fetchStats };
};
