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
    if (code !== PRO_CODE || !user) return false;
    const { error } = await supabase
      .from("pro_access")
      .insert({ user_id: user.id, code_used: code });
    if (error) return false;
    setIsPro(true);
    return true;
  };

  return { isPro, loading, activate };
}
