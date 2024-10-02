import OnboardingUI from "@/components/onboarding/OnboardingUI";

const PROJECT_URL = process.env.PROJECT_URL;

// getKYCStatus
async function getKYCStatus(email: string) {
  console.log("email in getKYCStatus", email, PROJECT_URL);
  const response = await fetch(`${PROJECT_URL}/api/kyc?email=${email}`, {
    method: "GET",
  });
  const data = await response.json();
  return data;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { email: string | undefined };
}) {
  const { email } = searchParams;
  let kycStatus = {
    status: null,
    sessionId: null,
  };
  if (email) {
    kycStatus = await getKYCStatus(decodeURIComponent(email));
    console.log("kycStatus", kycStatus);
  }

  return <OnboardingUI kycStatus={kycStatus} />;
}
