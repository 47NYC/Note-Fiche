import { useAuth } from "@/hooks/useAuth";
import StudentDashboard from "./StudentDashboard";
import TeacherDashboard from "./TeacherDashboard";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const { role, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (role === "teacher") return <TeacherDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;
