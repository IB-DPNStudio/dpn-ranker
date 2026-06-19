export default function AboutPage() {
  return (
    <div className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="font-heading text-4xl md:text-6xl font-bold mb-8">About Dentsu Podcast Network</h1>
        <div className="prose prose-lg dark:prose-invert">
          <p className="text-xl text-muted-foreground mb-12">
            We are building the definitive marketplace for premium podcast inventory in India.
          </p>
          
          <div className="space-y-12">
            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To empower India's leading podcast creators by connecting them with premium enterprise demand. 
                We believe that engaged audiences deserve quality sponsorships, and advertisers deserve transparent, 
                high-performing inventory.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-2xl font-bold mb-4">The Dentsu Advantage</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                As part of the global Dentsu network, DPN acts as a trusted intermediary between creators and the world's largest brands. 
                This is not a self-serve marketplace filled with noise. This is a curated, managed ecosystem where quality wins.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Vetted, brand-safe creators.</li>
                <li>Exclusive access to premium agency budgets.</li>
                <li>Data-driven rankings and pricing insights.</li>
                <li>Full-service campaign management.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
