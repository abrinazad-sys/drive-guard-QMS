import { useNavigate } from "react-router-dom";
import { LoginForm } from "./forms/LoginForm";

export default function Login() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden">
      {/* --- Page Background --- */}
      <div className="fixed inset-0 z-0">
        {/* Dark image background on the left */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("/images/1.jpg")' }}
        />
        {/* Light gray slanted overlay on the right */}
        <div
          className="absolute inset-0 bg-[#F0F2F5]"
          style={{ clipPath: "polygon(60% 0, 100% 0, 100% 100%, 45% 100%)" }}
        />
      </div>

      {/* --- Main Card Container --- */}
      <div className="relative z-10 w-full max-w-[1150px] h-[700px] max-h-[95vh] bg-white/95 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden">
        {/* Right Side (Form) - Sits in the background of the card */}
        <div className="absolute top-0 right-0 bottom-0 w-[55%] flex flex-col px-8 py-8 sm:px-12 lg:px-24 z-0">
          <div className="flex-1 flex flex-col justify-center max-w-[380px] w-full mx-auto">
            <div className="text-center mb-12 flex flex-col items-center">
              <img
                src="/images/bedata.png"
                alt="BeData Logo"
                className="h-16 w-auto mb-3"
              />
              <p className="text-[#6B7280] text-[15px] font-medium text-center">
                Welcome back to Drive Guard QMS
              </p>
            </div>

            <LoginForm onSuccess={handleSuccess} />
          </div>
        </div>

        {/* Left Side (Dark Image) - Positioned absolute to allow slanted overlap */}
        <div
          className="absolute top-3.5 bottom-3.5 left-3.5 z-10 hidden md:flex overflow-hidden rounded-[32px] flex flex-col text-white shadow-2xl"
          style={{
            width: "56%",
            clipPath: "polygon(0 0, 80% 0, 95% 100%, 0 100%)",
          }}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center"
            style={{ backgroundImage: 'url("/images/gpt1.png")' }}
          />
          <div className="absolute inset-0 z-0 bg-black/5 " />
        </div>
      </div>
    </div>
  );
}
