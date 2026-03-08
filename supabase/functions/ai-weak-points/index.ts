import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Fetch all practice sessions
    const { data: sessions } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false });

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({
        analysis: null,
        message: "Pas encore de sessions de pratique. Commence à t'entraîner pour voir ton analyse !",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Aggregate by subject
    const subjectStats: Record<string, { total: number; correct: number; sessions: number; points: number }> = {};
    for (const s of sessions) {
      const subj = s.subject || "Général";
      if (!subjectStats[subj]) subjectStats[subj] = { total: 0, correct: 0, sessions: 0, points: 0 };
      subjectStats[subj].total += s.cards_reviewed;
      subjectStats[subj].correct += s.correct_count;
      subjectStats[subj].sessions += 1;
      subjectStats[subj].points += s.points_earned;
    }

    const subjects = Object.entries(subjectStats).map(([name, s]) => ({
      name,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      totalQuestions: s.total,
      correctAnswers: s.correct,
      sessions: s.sessions,
      points: s.points,
    }));

    // Call AI for personalized recommendations
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "Tu es un tuteur IA qui analyse les performances d'un élève au Brevet. Donne des conseils personnalisés en français. Sois encourageant mais précis sur les points faibles.",
          },
          {
            role: "user",
            content: `Voici les statistiques de l'élève par matière:\n${JSON.stringify(subjects, null, 2)}\n\nAnalyse ses points faibles et donne 3-5 recommandations concrètes pour s'améliorer. Formate en markdown.`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_analysis",
            description: "Provide structured weak points analysis",
            parameters: {
              type: "object",
              properties: {
                weakSubjects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      subject: { type: "string" },
                      issue: { type: "string" },
                      recommendation: { type: "string" },
                      priority: { type: "string", enum: ["haute", "moyenne", "basse"] },
                    },
                    required: ["subject", "issue", "recommendation", "priority"],
                  },
                },
                overallAdvice: { type: "string" },
                encouragement: { type: "string" },
              },
              required: ["weakSubjects", "overallAdvice", "encouragement"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
      }),
    });

    let aiAnalysis = null;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        aiAnalysis = JSON.parse(toolCall.function.arguments);
      }
    }

    return new Response(JSON.stringify({ subjects, aiAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("weak-points error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
