import { useState, useEffect } from "react";
import { gamificationService, GamificationProfile } from "@/services/gamificationService";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProfileSummary() {
    const [profile, setProfile] = useState<GamificationProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await gamificationService.getProfile();
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch gamification profile", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div>Loading Profile...</div>;
    if (!profile) return <div>No profile data found.</div>;

    const nextLevelXP = 100 * profile.current_level; // Simple calculation from backend logic
    const prevLevelXP = 100 * (profile.current_level - 1);
    const currentProgress = profile.total_xp - prevLevelXP;
    const progressPercent = Math.min(100, (currentProgress / (nextLevelXP - prevLevelXP)) * 100);

    return (
        <Card className="w-full relative shadow-sm h-full border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {profile.username}
                        </CardTitle>
                        <p className="text-sm text-gray-500">Rank #{profile.rank || '-'}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-3xl font-extrabold text-blue-600">Lvl {profile.current_level}</span>
                        <span className="text-xs font-medium text-gray-400">Total XP: {profile.total_xp.toLocaleString()}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 font-medium text-gray-600">
                        <span>XP Progress</span>
                        <span>{Math.round(progressPercent)}% to Lvl {profile.current_level + 1}</span>
                    </div>
                    <Progress value={progressPercent} className="h-3 bg-blue-100" indicatorClassName="bg-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-orange-50 p-4 rounded-lg flex flex-col items-center border border-orange-100">
                        <span className="text-2xl mb-1">🔥 {profile.current_streak}</span>
                        <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Day Streak</span>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg flex flex-col items-center border border-purple-100">
                        <span className="text-2xl mb-1">🎖️ {profile.badges.length}</span>
                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Badges</span>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
                        Recent Badges
                        <span className="text-xs text-blue-500 cursor-pointer hover:underline">View All</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {profile.badges.length > 0 ? (
                            profile.badges.slice(0, 5).map((badge, idx) => (
                                <div key={idx} className="group relative">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl border border-gray-200 shadow-sm" title={badge.name}>
                                        {badge.icon}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic">No badges earned yet. Complete sessions!</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
