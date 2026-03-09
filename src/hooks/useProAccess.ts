import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PRO_CODE = "naVhhyFXE_s6uwD";

export function useProAccess() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsPro(false); setLoading(false); return; }
    supabase
      .from("pro_access")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setIsPro(!!data);
        setLoading(false);
      });
  }, [user]);

  const activate = async (code: string): Promise<boolean> => {
    if (!user) return false;

    // Check if it's the master Pro code
    if (code === PRO_CODE) {
      const { error } = await supabase
        .from("pro_access")
        .insert({ user_id: user.id, code_used: code });
      if (error) return false;
      setIsPro(true);
      return true;
    }

    // Check if it's a referral code
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, referrer_id, referred_user_id")
      .eq("referral_code", code)
      .maybeSingle();

    if (referral && !referral.referred_user_id && referral.referrer_id !== user.id) {
      // Valid referral code - activate Pro and mark referral as used
      const { error: proError } = await supabase
        .from("pro_access")
        .insert({ user_id: user.id, code_used: `referral:${code}` });
      if (proError) return false;

      // Mark the referral as used
      await supabase
        .from("referrals")
        .update({ referred_user_id: user.id, used_at: new Date().toISOString() })
        .eq("id", referral.id);

      setIsPro(true);
      return true;
    }

    return false;
  };

  return { isPro, loading, activate };
}
