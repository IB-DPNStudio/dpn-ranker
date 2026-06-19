import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export default async function AdminEOIsPage() {
  const supabase = await createClient();
  
  const { data: eois } = await supabase
    .from("eois")
    .select("*, agencies(company_name, email)")
    .order("created_at", { ascending: false });

  async function updateStatus(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    const supabase = await createClient();
    await supabase.from("eois").update({ status }).eq("id", id);
    revalidatePath("/admin/eois");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-heading">Campaigns (EOIs)</h1>
        <p className="text-muted-foreground mt-2">Manage all Expressions of Interest across the network.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-sm text-muted-foreground">
              <th className="p-4 font-medium">Campaign</th>
              <th className="p-4 font-medium">Agency / Brand</th>
              <th className="p-4 font-medium">Budget</th>
              <th className="p-4 font-medium">Submitted</th>
              <th className="p-4 font-medium text-right">Status Action</th>
            </tr>
          </thead>
          <tbody>
            {!eois || eois.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">No campaigns submitted yet.</td>
              </tr>
            ) : (
              eois.map((eoi) => (
                <tr key={eoi.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{eoi.campaign_name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{eoi.campaign_objective || 'No objective provided'}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{eoi.agencies?.company_name}</div>
                    <div className="text-xs text-muted-foreground">{eoi.brand}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium">{eoi.budget_range || 'TBD'}</div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(eoi.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <form action={updateStatus} className="inline-flex items-center space-x-2">
                      <input type="hidden" name="id" value={eoi.id} />
                      <select 
                        name="status" 
                        defaultValue={eoi.status}
                        className="bg-background border border-input rounded text-sm p-1"
                      >
                        <option value="draft">Draft</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button type="submit" className="text-xs bg-secondary hover:bg-secondary/80 px-2 py-1 rounded">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
