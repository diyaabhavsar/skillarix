import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { gamificationService, LeaderboardResponse, LeaderboardEntry } from "@/services/gamificationService";

export function LeaderboardComponent() {
    const [data, setData] = useState<LeaderboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        gamificationService.getLeaderboard('all_time', 10)
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch leaderboard", err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <Card className="w-full relative shadow-sm h-[400px] flex items-center justify-center">Loading Leaderboard...</Card>;
    }

    if (!data || data.entries.length === 0) {
        return <Card className="w-full relative shadow-sm h-[400px] flex items-center justify-center">No leaderboard data yet.</Card>
    }

    return (
        <Card className="w-full relative shadow-sm border border-gray-100">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🏆</span> Global Leaderboard
                </CardTitle>
                <CardDescription>Top performers across the platform</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="text-right">Level</TableHead>
                            <TableHead className="text-right">XP</TableHead>
                            <TableHead className="text-right hidden md:table-cell">Badges</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.entries.map((entry) => (
                            <TableRow key={entry.user_id} className={entry.rank <= 3 ? "bg-amber-50/50" : ""}>
                                <TableCell className="font-medium">
                                    {entry.rank === 1 ? '🥇' :
                                        entry.rank === 2 ? '🥈' :
                                            entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{entry.username}</span>
                                        <span className="text-xs text-muted-foreground md:hidden">Lvl {entry.current_level}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                        {entry.current_level}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-bold text-amber-600">{entry.total_xp.toLocaleString()}</TableCell>
                                <TableCell className="text-right hidden md:table-cell">{entry.badges_count}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
