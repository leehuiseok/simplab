import { Link } from "react-router-dom"; // ES import 사용 [[memory:5999249]]

type LinkButtonVariant = "primary" | "secondary";

interface LinkButtonProps {
  to: string;
  children: React.ReactNode;
  variant?: LinkButtonVariant;
  className?: string;
}

const base =
  "btn-animate rounded-xl px-8 py-4 text-center text-sm font-semibold shadow-lg transition-all duration-200 focus-ring";

const styles: Record<LinkButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-1",
  secondary:
    "border-2 border-slate-300 bg-white text-slate-900 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-1 hover:shadow-lg",
};

const LinkButton = ({
  to,
  children,
  variant = "primary",
  className = "",
}: LinkButtonProps) => {
  return (
    <Link to={to} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
};

export default LinkButton;
