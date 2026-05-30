import { useState, useEffect } from "react";
import AppSidebar from "@/components/AppSidebar";
import DashboardPage from "@/pages/DashboardPage";
import BookingPage from "@/pages/BookingPage";
import ValidationPage from "@/pages/ValidationPage";
import BillingPage from "@/pages/BillingPage";
import InventoryPage from "@/pages/InventoryPage";
import ProfilePage from "@/pages/ProfilePage";
import LoginPage from "@/pages/LoginPage";
import WeekPage from "@/pages/WeekPage";
import SchedulePage from "@/pages/SchedulePage";
import AvailabilityPage from "@/pages/AvailabilityPage";
import GeneralSchedulePage from "@/pages/GeneralSchedulePage";
import TestScriptPage from "@/pages/TestScriptPage";
import { useAuth, type UserRole } from "@/contexts/AuthContext";

const pages: Record<string, React.ComponentType> = {
  dashboard: DashboardPage,
  week: WeekPage,
  schedule: SchedulePage,
  availability: AvailabilityPage,
  generalSchedule: GeneralSchedulePage,
  booking: BookingPage,
  validation: ValidationPage,
  billing: BillingPage,
  inventory: InventoryPage,
  profile: ProfilePage,
};

const allowedByRole: Record<UserRole, string[]> = {
  direcao: ["dashboard", "generalSchedule", "booking", "validation", "inventory", "billing", "profile"],
  professor: ["dashboard", "schedule", "availability", "validation", "profile"],
  encarregado: ["week", "schedule", "booking", "validation", "inventory", "profile"],
};

const defaultByRole: Record<UserRole, string> = {
  direcao: "dashboard",
  professor: "dashboard",
  encarregado: "week",
};

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  useEffect(() => {
    if (user && !allowedByRole[user.tipo].includes(currentPage)) {
      setCurrentPage(defaultByRole[user.tipo]);
    }
  }, [user, currentPage]);

  // Demo route via query string
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("demo") === "1") {
    return <TestScriptPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const PageComponent = pages[currentPage] || DashboardPage;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 p-8 overflow-y-auto">
        <PageComponent {...({ onNavigate: setCurrentPage } as Record<string, unknown>)} />
      </main>
    </div>
  );
};

export default Index;
