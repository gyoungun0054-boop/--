import CheckInDashboard from "@/features/check-in/components/check-in-dashboard";

export const metadata = {
  title: "QR Check-in | NEXUS Admin",
  description: "NEXUS 행사 참가자 QR 입장 확인",
};

export default function AdminCheckInPage() {
  return <CheckInDashboard />;
}
