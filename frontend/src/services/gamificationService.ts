import { api } from "@/utils/api";

export interface Badge {
    _id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    rarity: string;
    earned_at?: string;
}

export interface Milestone {
    id: string;
    name: string;
    description: string;
    target_value: number;
    current_value: number;
    is_completed: boolean;
    progress_percentage: number;
    reward_xp: number;
    icon: string;
}

export interface UserStreak {
    user_id: string;
    current_streak: number;
    longest_streak: number;
}

export interface GamificationProfile {
    user_id: string;
    username: string;
    total_xp: number;
    current_level: number;
    rank: number;
    badges: Badge[];
    milestones_completed: number;
    current_streak: number;
    longest_streak: number;
    sessions_count: number;
}

export interface LeaderboardEntry {
    user_id: string;
    username: string;
    total_xp: number;
    current_level: number;
    rank: number;
    badges_count: number;
    sessions_count: number;
    average_score: number;
    streak_days: number;
}

export interface LeaderboardResponse {
    period: string;
    entries: LeaderboardEntry[];
    total_users: number;
}

export const gamificationService = {
    getProfile: async (): Promise<GamificationProfile> => {
        const response = await api.get<GamificationProfile>('/gamification/profile');
        return response;
    },

    getLeaderboard: async (period: 'all_time' | 'monthly' | 'weekly' | 'daily' = 'all_time', limit: number = 10): Promise<LeaderboardResponse> => {
        const response = await api.get<LeaderboardResponse>(`/gamification/leaderboard?period=${period}&limit=${limit}`);
        return response;
    },

    getBadges: async (): Promise<Badge[]> => {
        const response = await api.get<Badge[]>('/gamification/badges');
        return response;
    },

    getMilestones: async (): Promise<Milestone[]> => {
        const response = await api.get<Milestone[]>('/gamification/milestones');
        return response;
    },

    getStreak: async (): Promise<UserStreak> => {
        const response = await api.get<UserStreak>('/gamification/streak');
        return response;
    }
};
