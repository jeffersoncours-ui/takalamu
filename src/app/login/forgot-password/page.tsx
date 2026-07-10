import Link from "next/link";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16" style={{ background: "#F7F4EE" }}>
      <div className="w-full max-w-sm space-y-7">
        <div className="flex flex-col items-center text-center space-y-3">
          <Link href="/" className="flex flex-col items-center gap-3">
            <img src="/logo.png" alt="" style={{ height: 104, width: "auto" }} />
            <img src="/wordmark.png" alt="تتكلموا" style={{ height: 64, width: "auto" }} />
          </Link>
        </div>

        <div
          className="rounded-[20px] p-5"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 10px 26px rgba(28,26,23,.09)" }}
        >
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
