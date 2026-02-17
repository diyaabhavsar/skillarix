import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import {
    Trophy,
    Target,
    TrendingUp,
    Clock,
    Award,
    PlayCircle,
    BarChart3,
    BookOpen
} from "lucide-react";
import { toast } from "sonner";

interface SessionStats {
    totalSessions: number;
    averageScore: number;
    bestScore: number;
    totalPracticeTime: number;
    recentSessions: Array<{
        id: string;
        date: string;
        score: number;
        duration: number;
    }>;
}

const SalesmanDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<SessionStats>({
        totalSessions: 0,
        averageScore: 0,
        bestScore: 0,
        totalPracticeTime: 0,
        recentSessions: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setIsLoading(true);

            // Fetch stats and recent sessions in parallel
            const [statsRes, sessionsRes] = await Promise.all([
                api.get('/conversations/stats'),
                api.get('/conversations?limit=3')
            ]);

            const statsData = statsRes as any;
            const sessionsData = sessionsRes as any;

            const recent = (sessionsData?.data || []).map((session: any) => {
                // Calculate duration
                let duration = 0;
                if (session.created_at && session.updated_at) {
                    const start = new Date(session.created_at).getTime();
                    const end = new Date(session.updated_at).getTime();
                    duration = Math.round((end - start) / 60000);
                }

                // Get score safely
                // Try evaluation_data.score first, or fall back to calculation
                let score = session.evaluation_data?.score || 0;
                if (!score && session.evaluation_data?.complete_rating?.total?.score) {
                    const total = session.evaluation_data.complete_rating.total;
                    if (total.max > 0) {
                        score = (total.score / total.max) * 100;
                    }
                }

                return {
                    id: session._id,
                    date: session.created_at,
                    score: Math.round(score),
                    duration: duration > 0 ? duration : 0
                };
            });

            setStats({
                totalSessions: statsData.total_sessions || 0,
                averageScore: statsData.average_score || 0,
                bestScore: statsData.best_score || 0,
                totalPracticeTime: statsData.total_duration_minutes || 0,
                recentSessions: recent,
            });
        } catch (error) {
            console.error("Failed to fetch stats:", error);
            // toast.error("Failed to load statistics");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome back, {user?.username}! 👋
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Ready to improve your sales skills today?
                    </p>
                </div>
                <Button
                    size="lg"
                    onClick={() => navigate("/session/setup")}
                    className="gap-2"
                >
                    <PlayCircle className="h-5 w-5" />
                    Start Training
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Sessions
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSessions}</div>
                        <p className="text-xs text-muted-foreground">
                            Practice sessions completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Average Score
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            Across all sessions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Best Score
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.bestScore}%</div>
                        <p className="text-xs text-muted-foreground">
                            Personal best
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Practice Time
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(stats.totalPracticeTime)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total training time
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/session/setup")}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            <CardTitle>Start Practice Session</CardTitle>
                        </div>
                        <CardDescription>
                            Begin a new training session with AI personas
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/practice")}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <CardTitle>View Performance</CardTitle>
                        </div>
                        <CardDescription>
                            Review your past sessions and analytics
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/products")}>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-primary" />
                            <CardTitle>Study Products</CardTitle>
                        </div>
                        <CardDescription>
                            Learn about products for better training
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Recent Sessions */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Sessions</CardTitle>
                            <CardDescription>Your latest training sessions</CardDescription>
                        </div>
                        <Button variant="outline" onClick={() => navigate("/practice")}>
                            View All
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {stats.recentSessions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No sessions yet. Start your first training session!</p>
                            <Button
                                className="mt-4"
                                onClick={() => navigate("/session/setup")}
                            >
                                Start Training
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {stats.recentSessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                    onClick={() => navigate(`/feedback/${session.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {new Date(session.date).toLocaleDateString()}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                Duration: {session.duration} minutes
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{session.score}%</div>
                                            <div className="text-xs text-muted-foreground">Score</div>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Motivational Section */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-primary" />
                        <CardTitle>Keep Going! 🚀</CardTitle>
                    </div>
                    <CardDescription>
                        {stats.totalSessions < 5
                            ? "Complete 5 more sessions to unlock your first achievement!"
                            : stats.averageScore < 80
                                ? "You're doing great! Aim for an 80% average to reach the next level."
                                : "Excellent work! You're a top performer. Keep it up!"}
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
};

export default SalesmanDashboard;
