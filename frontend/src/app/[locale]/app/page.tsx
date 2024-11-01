// components
import AppNavbar from "@/components/app/AppNavbar";
import Bridge from "@/components/app/Bridge";
import Change from "@/components/app/Change";
import Deposit from "@/components/app/Deposit";
import Invest from "@/components/app/Invest";
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
      {searchParams.tab === "invest" && <Invest />}
      {searchParams.tab === "change" && <Change />}
      {searchParams.tab === "bridge" && <Bridge />}
    </main>
  );
}
