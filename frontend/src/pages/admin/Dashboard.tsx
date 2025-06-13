import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { api } from "@/utils/api";
import { DashboardStats, DashboardUser, DashboardSession } from "@/types/dashboard";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    active_users: 0,
    sessions_completed: 0,
    average_score: 0,
    products: 0,
  });

  // Update state definitions with proper types
  const [latestUsers, setLatestUsers] = useState<DashboardUser[]>([]);
  const [latestSessions, setLatestSessions] = useState<DashboardSession[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<DashboardStats>("/admin/stats");
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const users = await api.get<DashboardUser[]>("/admin/latest-users");
        setLatestUsers(users);
        const sessions = await api.get<DashboardSession[]>("/admin/latest-sessions");
        setLatestSessions(sessions);
      } catch (error) {
        console.error('Error fetching latest data:', error);
        setLatestUsers([]);
        setLatestSessions([]);
      }
    };
    fetchLatest();
  }, []);

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild>
            <Link to="/products">Add Product</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Sessions Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.sessions_completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.average_score}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.products}</div>
            {/* <p className="text-xs text-muted-foreground mt-1">Active training products</p> */}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Users */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Users</CardTitle>
                <CardDescription>Newest registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestUsers.map(u => (
                    <div key={u._id} className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <p className="font-medium">{u.username}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${u.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {u.active ? "Active" : "Inactive"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {u.role === "admin" ? "Admin" : "Employee"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" asChild>
                  <Link to="/admin/users">View All Users</Link>
                </Button>
              </CardContent>
            </Card>
            {/* Latest Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Sessions</CardTitle>
                <CardDescription>Most recent completed sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {latestSessions.map(s => (
                    <div key={s._id} className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <p className="font-medium">{s.user_name}</p>
                        <p className="text-sm text-muted-foreground">{s.product_name}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          s.score >= 80 ? "bg-green-100 text-green-800" :
                          s.score >= 70 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {s.score !== undefined && s.score !== null ? `${s.score}%` : "N/A"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" asChild>
                  <Link to="/Practice">View All Sessions</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
