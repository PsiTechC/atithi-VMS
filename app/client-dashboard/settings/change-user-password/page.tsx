import ChangeUserPassword from "./change-user-password";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ChangeUserPasswordPage() {
  return (
    <DashboardLayout title="Change Password" showHeaderNav={true}>
      <div className="max-w-xl mx-auto mt-8">
        <Link href="/client-dashboard/check-in" className="flex items-center gap-2 text-primary hover:underline mb-4">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Check-In</span>
        </Link>
        <ChangeUserPassword />
      </div>
    </DashboardLayout>
  );
}
