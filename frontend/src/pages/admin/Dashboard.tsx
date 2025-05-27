
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const totalUsers = 24;
  const activeUsers = 18;
  const completedSessions = 142;
  const averageScore = 76;
  
  // Mock performance data
  const topPerformers = [
    { id: 1, name: "Emily Johnson", sessions: 12, avgScore: 92, improvement: "+15%" },
    { id: 2, name: "Michael Chen", sessions: 9, avgScore: 89, improvement: "+12%" },
    { id: 3, name: "Sarah Williams", sessions: 15, avgScore: 87, improvement: "+9%" },
  ];
  
  // Mock recent sessions data
  const recentSessions = [
    { id: 1, user: "David Miller", product: "CloudGuard Pro", date: "May 13, 2023", score: 82 },
    { id: 2, user: "Jessica Parker", product: "DataSync 360", date: "May 12, 2023", score: 75 },
    { id: 3, user: "Robert Lewis", product: "DevOpsFlow", date: "May 11, 2023", score: 68 },
    { id: 4, user: "Amanda Chen", product: "CloudGuard Pro", date: "May 10, 2023", score: 91 },
  ];

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild>
            <Link to="/setup">Add Product</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeUsers} active users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Sessions Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedSessions}</div>
            <p className="text-xs text-green-500 mt-1">+24 this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}%</div>
            <p className="text-xs text-green-500 mt-1">+3% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-muted-foreground mt-1">Active training products</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Performance</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Users with the highest average scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topPerformers.map(performer => (
                    <div key={performer.id} className="flex items-center justify-between pb-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {performer.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{performer.name}</p>
                          <p className="text-sm text-muted-foreground">{performer.sessions} sessions completed</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{performer.avgScore}%</p>
                        <p className="text-sm text-green-500">{performer.improvement}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" asChild>
                  <Link to="/admin/users">View All Users</Link>
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Latest practice sessions completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSessions.map(session => (
                    <div key={session.id} className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <p className="font-medium">{session.user}</p>
                        <p className="text-sm text-muted-foreground">{session.product}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          session.score >= 80 ? "bg-green-100 text-green-800" : 
                          session.score >= 70 ? "bg-yellow-100 text-yellow-800" : 
                          "bg-red-100 text-red-800"
                        }`}>
                          {session.score}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{session.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4" asChild>
                  <Link to="/past-sessions">View All Sessions</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Performance Overview</CardTitle>
              <CardDescription>Detailed user performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">User performance data would be displayed here.</p>
              <Button variant="outline" asChild className="mb-2">
                <Link to="/admin/users">View Detailed User Analytics</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Recent system actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">System activity logs would be displayed here.</p>
              <Button variant="outline">
                Export Activity Log
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
