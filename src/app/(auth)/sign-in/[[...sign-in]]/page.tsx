import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <SignIn />
    </div>
  );
}
