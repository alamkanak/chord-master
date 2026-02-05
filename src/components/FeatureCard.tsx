interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  size?: "lg" | "md";
}

export default function FeatureCard({
  icon,
  title,
  description,
  size = "lg",
}: FeatureCardProps) {
  if (size === "md") {
    return (
      <div className="group rounded-lg border border-slate-200/50 bg-white/50 hover:bg-white p-6 hover:border-slate-300 transition-all duration-300 hover:shadow-md">
        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        <p className="text-slate-600 text-xs mt-1">{description}</p>
      </div>
    );
  }

  return (
    <div className="group rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur p-8 hover:border-slate-300 hover:bg-white hover:shadow-xl transition-all duration-300">
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}
