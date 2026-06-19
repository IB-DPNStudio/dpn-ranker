import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Play, TrendingUp } from "lucide-react";

export function FeaturedPodcasts() {
  const podcasts = [
    { name: "The Tech Daily", host: "Sarah Jenkins", rank: 1, genre: "Technology", score: 98.4 },
    { name: "Market Movers", host: "Rahul Desai", rank: 2, genre: "Business", score: 96.2 },
    { name: "Pop Culture Hour", host: "Amit & Neha", rank: 3, genre: "Entertainment", score: 94.8 },
    { name: "Deep Dive India", host: "Priya Sharma", rank: 4, genre: "News", score: 93.5 },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="space-y-4">
            <h2 className="font-heading text-3xl md:text-4xl font-bold">Featured Catalog</h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Discover the top performing podcasts across the network, hand-curated for premium brand integrations.
            </p>
          </div>
          <Button variant="ghost" className="mt-4 md:mt-0 group" asChild>
            <Link href="/rankings">
              View Full Rankings 
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {podcasts.map((podcast, i) => (
            <div key={i} className="group rounded-xl border border-border bg-card overflow-hidden hover:border-dentsu/50 transition-colors cursor-pointer">
              <div className="aspect-square bg-muted relative flex items-center justify-center">
                {/* Placeholder for actual cover art */}
                <Play className="w-12 h-12 text-muted-foreground/50 group-hover:text-dentsu transition-colors" />
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur text-foreground px-2 py-1 rounded text-xs font-bold font-mono">
                  #{podcast.rank}
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-dentsu transition-colors">{podcast.name}</h3>
                  <p className="text-sm text-muted-foreground">{podcast.host}</p>
                </div>
                <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
                  <span className="bg-secondary px-2 py-1 rounded-md text-xs font-medium">{podcast.genre}</span>
                  <div className="flex items-center space-x-1 text-spotify">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-mono font-bold">{podcast.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
