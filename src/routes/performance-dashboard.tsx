import { db } from "@/config/firebase.config";
import { Interview, UserAnswer } from "@/types";
import { useAuth } from "@clerk/clerk-react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoaderPage } from "./loader-page";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  BarChart3,
  Trophy,
  Target,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts";

export const PerformanceDashboard = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [allAnswers, setAllAnswers] = useState<UserAnswer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        // Fetch all interviews
        const interviewQuery = query(
          collection(db, "interviews"),
          where("userId", "==", userId)
        );
        const interviewSnap = await getDocs(interviewQuery);
        const interviewList = interviewSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Interview[];
        setInterviews(interviewList);

        // Fetch all user answers
        const answersQuery = query(
          collection(db, "userAnswers"),
          where("userId", "==", userId)
        );
        const answersSnap = await getDocs(answersQuery);
        const answerList = answersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UserAnswer[];
        setAllAnswers(answerList);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load performance data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalInterviews = interviews.length;
    const totalAnswers = allAnswers.length;
    const avgRating =
      totalAnswers > 0
        ? (
            allAnswers.reduce((sum, a) => sum + a.rating, 0) / totalAnswers
          ).toFixed(1)
        : "0.0";
    const bestRating =
      totalAnswers > 0 ? Math.max(...allAnswers.map((a) => a.rating)) : 0;

    return { totalInterviews, totalAnswers, avgRating, bestRating };
  }, [interviews, allAnswers]);

  // Rating distribution data (1-10)
  const ratingDistribution = useMemo(() => {
    const dist = Array.from({ length: 10 }, (_, i) => ({
      rating: `${i + 1}`,
      count: 0,
    }));
    allAnswers.forEach((a) => {
      const idx = Math.min(Math.max(Math.round(a.rating) - 1, 0), 9);
      dist[idx].count++;
    });
    return dist;
  }, [allAnswers]);

  // Performance over time (per interview)
  const performanceOverTime = useMemo(() => {
    return interviews
      .map((interview) => {
        const answers = allAnswers.filter(
          (a) => a.mockIdRef === interview.id
        );
        if (answers.length === 0) return null;
        const avg =
          answers.reduce((sum, a) => sum + a.rating, 0) / answers.length;
        return {
          name: interview.position.length > 15
            ? interview.position.substring(0, 15) + "…"
            : interview.position,
          rating: parseFloat(avg.toFixed(1)),
          questions: answers.length,
        };
      })
      .filter(Boolean);
  }, [interviews, allAnswers]);

  // Overall rating as radial data
  const overallRadial = useMemo(() => {
    const avg = parseFloat(stats.avgRating as string);
    return [{ name: "Rating", value: avg * 10, fill: "#6366f1" }];
  }, [stats]);

  // Recent feedbacks
  const recentFeedbacks = useMemo(() => {
    return [...allAnswers]
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [allAnswers]);

  // Colors for bar chart
  const getBarColor = (rating: string) => {
    const r = parseInt(rating);
    if (r <= 3) return "#f43f5e";
    if (r <= 5) return "#f59e0b";
    if (r <= 7) return "#6366f1";
    return "#10b981";
  };

  if (loading) {
    return <LoaderPage className="w-full h-[70vh]" />;
  }

  return (
    <div className="flex flex-col w-full gap-8 py-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/generate")}
            className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Interviews
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Performance Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your interview progress and improve
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Interviews
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.totalInterviews}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Rating
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.avgRating}
                  <span className="text-base font-normal text-muted-foreground">
                    /10
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Best Rating
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.bestRating}
                  <span className="text-base font-normal text-muted-foreground">
                    /10
                  </span>
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Questions Answered
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {stats.totalAnswers}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <Target className="h-6 w-6 text-rose-500" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg">Rating Distribution</CardTitle>
            </div>
            <CardDescription className="mb-6">
              How your answers are distributed across ratings
            </CardDescription>
            {allAnswers.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ratingDistribution} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="rating"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {ratingDistribution.map((entry) => (
                      <Cell
                        key={entry.rating}
                        fill={getBarColor(entry.rating)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Complete some interviews to see your stats!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Over Time */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <CardTitle className="text-lg">
                Performance By Interview
              </CardTitle>
            </div>
            <CardDescription className="mb-6">
              Average rating per interview
            </CardDescription>
            {performanceOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={performanceOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rating"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{
                      fill: "#6366f1",
                      strokeWidth: 2,
                      r: 5,
                      stroke: "#fff",
                    }}
                    activeDot={{
                      fill: "#6366f1",
                      strokeWidth: 2,
                      r: 7,
                      stroke: "#fff",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                No data yet. Complete some interviews to see your trends!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Rating Gauge + Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overall score gauge */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <CardTitle className="text-lg mb-4 self-start">
              Overall Score
            </CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={16}
                data={overallRadial}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  fill="#6366f1"
                  background={{ fill: "#e2e8f0" }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-16 text-center">
              <p className="text-4xl font-bold text-slate-900">
                {stats.avgRating}
              </p>
              <p className="text-sm text-muted-foreground">out of 10</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Feedbacks */}
        <Card className="border border-slate-200 shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Recent Feedback</CardTitle>
            </div>
            <CardDescription className="mb-4">
              Your latest interview feedback
            </CardDescription>

            {recentFeedbacks.length > 0 ? (
              <div className="space-y-3">
                {recentFeedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className={`flex-shrink-0 h-9 w-9 rounded-lg flex items-center justify-center text-sm font-bold text-white ${
                        fb.rating >= 7
                          ? "bg-emerald-500"
                          : fb.rating >= 4
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    >
                      {fb.rating}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {fb.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {fb.feedback}
                      </p>
                    </div>
                    <Star className="flex-shrink-0 h-4 w-4 text-amber-400 mt-0.5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                No feedback yet. Start practicing!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
