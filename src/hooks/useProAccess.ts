import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PRO_CODE = "naVhhyFXE_s6uwD";

export function useProAccess() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralsCount, setReferralsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const referralLink = useMemo(() => {
    if (!referralCode) return null;
    return `${window.location.origin}/auth?ref=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!user) {
        if (cancelled) return;
        setIsPro(false);
        setExpiresAt(null);
        setReferralCode(null);
        setReferralsCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1) Pro status (supporte essai: expires_at)
      const { data: proRow } = await supabase
        .from("pro_access")
        .select("id, expires_at, activated_at")
        .eq("user_id", user.id)
        .order("activated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const expires = proRow?.expires_at ?? null;
      const active = !!proRow && (!expires || new Date(expires) > new Date());

      // 2) Permanent referral code row (referred_user_id IS NULL)
      const { data: existingCode } = await supabase
        .from("referrals")
        .select("referral_code")
        .eq("referrer_id", user.id)
        .is("referred_user_id", null)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      let code = existingCode?.referral_code ?? null;
      if (!code) {
        const { data: inserted } = await supabase
          .from("referrals")
          .insert({ referrer_id: user.id })
          .select("referral_code")
          .maybeSingle();
        code = inserted?.referral_code ?? null;
      }

      // 3) Count successful referrals
      const { count } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", user.id)
        .not("referred_user_id", "is", null);

      if (cancelled) return;
      setIsPro(active);
      setExpiresAt(expires);
      setReferralCode(code);
      setReferralsCount(count ?? 0);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activate = async (code: string): Promise<boolean> => {
    if (!user) return false;
    if (code !== PRO_CODE) return false;

    // Met le compte en Pro permanent (expires_at = NULL)
    const { data: existing } = await supabase
      .from("pro_access")
      .select("id")
      .eq("user_id", user.id)
      .order("activated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("pro_access")
        .update({ expires_at: null, code_used: code })
        .eq("id", existing.id);
      if (error) return false;
    } else {
      const { error } = await supabase.from("pro_access").insert({ user_id: user.id, code_used: code });
      if (error) return false;
    }

    setIsPro(true);
    setExpiresAt(null);
    return true;
  };

  return { isPro, expiresAt, referralCode, referralLink, referralsCount, loading, activate };
}
