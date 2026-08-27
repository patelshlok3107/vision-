export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="font-display text-xs tracking-[0.3em]">VISION</div>
      <h1 className="text-3xl font-light mt-4">Check your inbox.</h1>
      <p className="text-white/50 text-sm mt-2 max-w-sm">We sent a verification link to your email address.</p>
      <button className="mt-8 bg-white text-black rounded-full px-8 py-2.5 text-sm font-medium">Resend</button>
      <a className="text-xs text-white/40 mt-4 hover:text-white">Change email address</a>
    </div>
  );
}
