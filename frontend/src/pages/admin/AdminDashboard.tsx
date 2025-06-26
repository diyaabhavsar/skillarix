"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import {
  DashboardStats,
  DashboardUser,
  DashboardSession,
} from "@/types/dashboard";
import { motion } from "framer-motion";
import AppCard from "@/components/AppCard";

// Optional: Custom spinner or use your own component
const Spinner = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="w-4 h-4 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
    <div className="w-4 h-4 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
    <div className="w-4 h-4 rounded-full bg-primary animate-bounce" />
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    total_users: 0,
    sessions_completed: 0,
    average_score: 0,
    products: 0,
  });

  const [latestUsers, setLatestUsers] = useState<DashboardUser[]>([]);
  const [latestSessions, setLatestSessions] = useState<DashboardSession[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, usersRes, sessionsRes] = await Promise.all([
          api.get("/users/admin/stats"),
          api.get("/users/admin/latest-users"),
          api.get("/users/admin/latest-sessions"),
        ]);

        if (typeof statsRes === "object" && statsRes !== null) {
          setStats(statsRes as DashboardStats);
        }
        if (Array.isArray(usersRes)) {
          setLatestUsers(usersRes as DashboardUser[]);
        }
        if (Array.isArray(sessionsRes)) {
          setLatestSessions(sessionsRes as DashboardSession[]);
        }
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statData = [
    { label: "Total Users", value: stats.total_users },
    { label: "Active Users", value: stats.total_users - 1 },
    { label: "Sessions Completed", value: stats.sessions_completed },
    { label: "Average Score", value: `${stats.average_score}%` },
    { label: "Products", value: stats.products },
  ];

  const cardColors = [
    "bg-purple-50",
    "bg-green-50",
    "bg-yellow-50",
    "bg-blue-50",
    "bg-pink-50",
  ];

  // ⏳ Modern loading screen
  if (loading) {
    return (
      <div className="h-screen flex flex-col justify-center items-center text-center space-y-4">
        <Spinner />
        <p className="text-muted-foreground text-base font-medium">
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="container px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back,{" "}
            <span className="font-semibold">{user?.name || "Admin"}</span>
          </p>
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

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {statData.map((stat, i) => (
          <motion.div
            key={stat.label}
            whileHover={{ scale: 1.03 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`${
                cardColors[i % cardColors.length]
              } shadow-md hover:shadow-lg transition`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabbed Content */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Latest Users */}
            <AppCard title="Latest Users" description="Newest registered users">
              <div className="space-y-4">
                {latestUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{u.username}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          u.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.active ? "Active" : "Inactive"}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link to="/admin/users">View All Users</Link>
              </Button>
            </AppCard>

            {/* Latest Sessions */}
            <AppCard
              title="Latest Sessions"
              description="Most recent completed sessions"
            >
              <div className="space-y-4">
                {latestSessions.map((s) => (
                  <div
                    key={s._id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{s.user_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {s.product_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.score >= 80
                            ? "bg-green-100 text-green-800"
                            : s.score >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.score ?? 0}%
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="ghost" className="w-full mt-4" asChild>
                <Link to="/Practice">View All Sessions</Link>
              </Button>
            </AppCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
