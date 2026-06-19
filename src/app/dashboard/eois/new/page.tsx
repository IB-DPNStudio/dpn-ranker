import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function NewEOIPage({
  searchParams,
}: {
  searchParams: Promise<{ podcast_id?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
 
  if (!user) redirect("/login");
 
  // Get agency ID
  const { data: agency } = await supabase
    .from("agencies")
    .select("id, name, company_name")
    .eq("owner_id", user.id)
    .single();
 
  let prefilledPodcast = null;
  if (resolvedSearchParams.podcast_id) {
    const { data } = await supabase
      .from("podcasts")
      .select("id, show_name")
      .eq("id", resolvedSearchParams.podcast_id)
      .single();
    prefilledPodcast = data;
  }

  async function submitEOI(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agencyData } = await supabase
      .from("agencies")
      .select("id, company_name")
      .eq("owner_id", user.id)
      .single();

    const podcastId = formData.get("podcast_id") as string;
    const podcastArr = podcastId ? [podcastId] : [];

    const { error } = await supabase.from("eois").insert({
      agency_id: agencyData?.id,
      status: 'draft', // or submitted
      campaign_name: formData.get("campaignName") as string,
      brand: formData.get("brand") as string,
      agency: agencyData?.company_name || "Direct",
      campaign_objective: formData.get("objective") as string,
      start_date: formData.get("startDate") as string,
      end_date: formData.get("endDate") as string,
      target_audience: formData.get("targetAudience") as string,
      budget_range: formData.get("budget") as string,
      notes: formData.get("notes") as string,
      desired_podcasts: podcastArr,
      inventory_requested: {
        sponsorship: formData.get("sponsorship") === "on",
        host_read: formData.get("hostRead") === "on",
      }
    });

    if (!error) {
      redirect("/dashboard/eois?success=true");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold mb-2">Draft Campaign EOI</h1>
        <p className="text-muted-foreground">Submit an Expression of Interest to start a campaign conversation with the DPN team.</p>
      </div>

      <div className="bg-card border border-border p-8 rounded-2xl shadow-sm">
        <form action={submitEOI} className="space-y-6">
          
          {prefilledPodcast && (
            <div className="bg-secondary/50 p-4 rounded-lg border border-border flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Targeting Podcast</p>
                <p className="font-bold">{prefilledPodcast.show_name}</p>
              </div>
              <input type="hidden" name="podcast_id" value={prefilledPodcast.id} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="campaignName" className="text-sm font-medium">Campaign Name *</label>
              <Input id="campaignName" name="campaignName" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="brand" className="text-sm font-medium">Brand / Advertiser *</label>
              <Input id="brand" name="brand" required />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="objective" className="text-sm font-medium">Campaign Objective</label>
            <Input id="objective" name="objective" placeholder="e.g. Brand Awareness, Lead Gen, App Installs" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="targetAudience" className="text-sm font-medium">Target Audience</label>
              <Input id="targetAudience" name="targetAudience" placeholder="e.g. Gen Z, Tech Enthusiasts" />
            </div>
            <div className="space-y-2">
              <label htmlFor="budget" className="text-sm font-medium">Budget Range</label>
              <select id="budget" name="budget" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Select...</option>
                <option value="<5L">Under ₹5L</option>
                <option value="5L-20L">₹5L - ₹20L</option>
                <option value="20L-50L">₹20L - ₹50L</option>
                <option value="50L+">₹50L+</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Requested Inventory Types</label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="sponsorship" name="sponsorship" className="rounded border-input" />
                <label htmlFor="sponsorship" className="text-sm">Sponsorship</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="hostRead" name="hostRead" className="rounded border-input" />
                <label htmlFor="hostRead" className="text-sm">Host Read</label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">Additional Notes</label>
            <Textarea id="notes" name="notes" rows={4} placeholder="Any specific requirements or questions?" />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" className="bg-dentsu hover:bg-dentsu/90 text-white px-8">
              Submit Draft EOI
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
