import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default async function ClaimPodcastPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login but keep the claim token so they come back here after logging in
    redirect(`/login?next=/claim?token=${token}`);
  }

  // Fetch the podcast
  const { data: podcast, error: pErr } = await supabase
    .from("podcasts")
    .select("id, show_name, owner_id")
    .eq("id", token)
    .single();

  if (pErr || !podcast) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Podcast Not Found</h1>
          <p className="text-muted-foreground mb-6">The claim link you followed is invalid or has expired.</p>
          <Button asChild><Link href="/">Go Home</Link></Button>
        </div>
      </div>
    );
  }

  if (podcast.owner_id) {
    if (podcast.owner_id === user.id) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md border border-border">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-4">Already Claimed!</h1>
            <p className="text-muted-foreground mb-6">You have already claimed <strong>{podcast.show_name}</strong>.</p>
            <Button asChild className="bg-dentsu text-white hover:bg-dentsu/90"><Link href="/dashboard">Go to Dashboard</Link></Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Already Claimed</h1>
            <p className="text-muted-foreground mb-6">This podcast has already been claimed by another user.</p>
            <Button asChild><Link href="/">Go Home</Link></Button>
          </div>
        </div>
      );
    }
  }

  // Assign the podcast to this user
  const { createAdminClient } = await import("@/utils/supabase/server");
  const adminClient = createAdminClient();
  
  const { error: claimErr } = await adminClient
    .from("podcasts")
    .update({ owner_id: user.id })
    .eq("id", podcast.id);

  if (claimErr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-sm text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-500">Error Claiming Podcast</h1>
          <p className="text-muted-foreground mb-6">There was an error claiming your podcast. Please try again or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20">
      <div className="bg-card p-10 rounded-2xl shadow-sm text-center max-w-lg border border-border">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold font-heading mb-4 text-dentsu">Podcast Claimed!</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Congratulations! You are now the official owner of <strong>{podcast.show_name}</strong> on the DPN Platform.
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          You can now access your creators dashboard to see your fans, listening times, and handle micropayments.
        </p>
        <Button asChild className="w-full h-12 text-lg bg-dentsu text-white hover:bg-dentsu/90">
          <Link href="/dashboard">Access Creator Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
