"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Admin client using service role key to bypass RLS and use Auth Admin API
const getAdminClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  
  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
};

export async function inviteUser(email: string, role: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Unauthorized");

    // Verify inviter is super_admin or dpn_sales
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
      throw new Error("Unauthorized: Only admins can invite users");
    }

    const adminAuthClient = getAdminClient().auth.admin;

    // Send the invite
    const { data, error } = await adminAuthClient.inviteUserByEmail(email, {
      data: {
        role: role
      }
    });

    if (error) {
      console.error("Invite Error:", error);
      return { success: false, error: error.message };
    }

    if (data?.user?.id) {
      // Small delay to let the trigger run
      await new Promise(r => setTimeout(r, 1000));
      await getAdminClient()
        .from("profiles")
        .update({ role: role })
        .eq("id", data.user.id);
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (err: any) {
    console.error("Error inviting user:", err);
    return { success: false, error: err.message };
  }
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== 'super_admin' && profile?.role !== 'dpn_sales') {
      throw new Error("Unauthorized: Only admins can change roles");
    }

    const adminDbClient = getAdminClient();

    const { error } = await adminDbClient
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (err: any) {
    console.error("Error updating role:", err);
    return { success: false, error: err.message };
  }
}
