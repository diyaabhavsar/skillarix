import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, UserCheck, Package, BarChart2, Percent, User } from "lucide-react";
import { Link } from "react-router-dom";

const statCards = [
  {
    title: "Total Users",
    value: 1240,
    icon: <Users className="w-6 h-6 text-blue-500" />,
  },
  {
    title: "Active Users",
    value: 980,
    icon: <UserCheck className="w-6 h-6 text-green-500" />,
  },
  {
    title: "Products",
    value: 12,
    icon: <Package className="w-6 h-6 text-purple-500" />,
  },
  {
    title: "Sessions Completed",
    value: 3200,
    icon: <BarChart2 className="w-6 h-6 text-orange-500" />,
  },
  {
    title: "Average Score (%)",
    value: "78%",
    icon: <Percent className="w-6 h-6 text-yellow-500" />,
  },
];

const latestUsers = [
  { name: "Alice Smith", email: "alice@company.com", role: "Admin", active: true },
  { name: "Bob Lee", email: "bob@company.com", role: "Employee", active: true },
  { name: "Carol Jones", email: "carol@company.com", role: "Employee", active: false },
  { name: "David Kim", email: "david@company.com", role: "Employee", active: true },
];

const latestSessions = [
  { user: "Alice Smith", product: "CloudGuard Pro", score: 85, date: "2025-06-20" },
  { user: "Bob Lee", product: "DataSync 360", score: 65, date: "2025-06-19" },
  { user: "Carol Jones", product: "DevOpsFlow", score: 28, date: "2025-06-18" },
  { user: "David Kim", product: "CloudGuard Pro", score: 72, date: "2025-06-17" },
];

function getScoreColor(score: number) {
  if (score > 70) return "bg-green-100 text-green-800";
  if (score >= 30) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

const AdminDashboard = () => (
  <div className="container p-6">
    {/* Stat Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title} className="rounded-xl border shadow-sm flex flex-col items-center p-4 gap-2">
          <div className="flex items-center gap-2">
            {stat.icon}
            <span className="font-bold text-sm text-muted-foreground">{stat.title}</span>
          </div>
          <div className="text-3xl font-bold mt-2">{stat.value}</div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Latest Users */}
      <Card className="rounded-xl border shadow-sm flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Latest Users</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 px-4">
            <div className="flex flex-col gap-4 py-4">
              {latestUsers.map((u, i) => (
                <div key={u.email} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={u.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {u.active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link to="/admin/users">View All Users</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Latest Sessions */}
      <Card className="rounded-xl border shadow-sm flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold">Latest Sessions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-64 px-4">
            <div className="flex flex-col gap-4 py-4">
              {latestSessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="font-medium">{s.user}</div>
                    <div className="text-xs text-muted-foreground">{s.product}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={getScoreColor(s.score)}>{s.score}%</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link to="/practice">View All Sessions</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default AdminDashboard;
