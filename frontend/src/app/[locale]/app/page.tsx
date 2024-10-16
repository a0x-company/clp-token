// components
import AppNavbar from "@/components/app/AppNavbar";
import Deposit from "@/components/app/Deposit";
import Withdraw from "@/components/app/Withdraw";

export default function App({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <main className="min-h-screen min-w-screen bg-white text-black flex flex-col">
      <AppNavbar />
      {(searchParams.tab === "deposit" || !searchParams.tab) && <Deposit />}
      {searchParams.tab === "withdraw" && <Withdraw />}
    </main>
  );
}
