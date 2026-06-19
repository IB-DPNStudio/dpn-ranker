import { CheckCircle2, UserCheck, BarChart3, Megaphone } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <UserCheck className="w-8 h-8 text-dentsu" />,
      title: "Join & Get Reviewed",
      description: "Submit your podcast details. Our team reviews your content, audience quality, and brand safety."
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-dentsu" />,
      title: "Rankings & Discovery",
      description: "Once approved, your podcast is scored and ranked weekly, making you discoverable to top agencies."
    },
    {
      icon: <Megaphone className="w-8 h-8 text-dentsu" />,
      title: "Campaign Opportunities",
      description: "Agencies submit Expressions of Interest (EOIs) for sponsorships, host reads, and targeted campaigns."
    },
    {
      icon: <CheckCircle2 className="w-8 h-8 text-dentsu" />,
      title: "Execute & Earn",
      description: "Run the campaigns through our managed ecosystem and turn your audience into predictable revenue."
    }
  ];

  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-heading text-3xl md:text-4xl font-bold">How the Network Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A streamlined process designed to remove friction between premium creators and enterprise advertisers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          <div className="hidden lg:block absolute top-12 left-24 right-24 h-0.5 bg-border -z-10"></div>
          {steps.map((step, i) => (
            <div key={i} className="relative bg-card text-center space-y-4 pt-8">
              <div className="mx-auto w-16 h-16 rounded-full bg-background border-2 border-border flex items-center justify-center">
                {step.icon}
              </div>
              <h3 className="font-bold text-xl">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed px-4">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
