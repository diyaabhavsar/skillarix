import { useState, useEffect } from "react";
import { ProfileSummary } from "@/components/gamification/ProfileSummary";
import { LeaderboardComponent } from "@/components/gamification/LeaderboardComponent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { gamificationService, Milestone, Badge } from "@/services/gamificationService";
import { Trophy, Medal, Flame, Calendar, Star } from "lucide-react";

export function GamificationDashboard() {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);

    useEffect(() => {
        gamificationService.getMilestones().then(setMilestones);
        gamificationService.getBadges().then(setBadges);
    }, []);

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 inline-flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-yellow-500" /> Gamification Hub
                    </h1>
                    <p className="text-muted-foreground mt-1">Track your progress, earn rewards, and compete!</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Section */}
                <div className="md:col-span-1 space-y-6">
                    <ProfileSummary />

                    <Card className="shadow-sm border-purple-100">
                        <CardHeader className="bg-purple-50/50 pb-3">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Medal className="h-5 w-5 text-purple-600" /> Your Achievements
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <ScrollArea className="h-[300px] w-full pr-4">
                                <div className="grid grid-cols-3 gap-4">
                                    {badges.map((badge) => (
                                        <div key={badge._id} className="flex flex-col items-center text-center group cursor-pointer">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center text-3xl shadow-sm border border-yellow-200 group-hover:scale-110 transition-transform duration-200">
                                                {badge.icon}
                                            </div>
                                            <span className="text-xs font-medium mt-2 line-clamp-2 leading-tight">{badge.name}</span>
                                        </div>
                                    ))}
                                    {badges.length === 0 && (
                                        <div className="col-span-3 text-center text-gray-400 py-8">
                                            <Star className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                            <p>Complete sessions to earn your first badge!</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="milestones" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="milestones">Milestones & Progress</TabsTrigger>
                            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                        </TabsList>

                        <TabsContent value="milestones" className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                {milestones.map((ms) => (
                                    <Card key={ms.id} className={`border-l-4 ${ms.is_completed ? 'border-l-green-500 bg-green-50/30' : 'border-l-blue-200'}`}>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 ${ms.is_completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 grayscale'}`}>
                                                {ms.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-800">{ms.name}</h4>
                                                    <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                        {ms.is_completed ? 'COMPLETED' : `${ms.current_value} / ${ms.target_value}`}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">{ms.description}</p>
                                                <Progress value={ms.progress_percentage} className="h-2" />
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs font-bold text-amber-600 block">+{ms.reward_xp} XP</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="leaderboard">
                            <LeaderboardComponent />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default GamificationDashboard;
