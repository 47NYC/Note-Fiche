import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_FREE = `Tu es un tuteur IA pour le Brevet des collèges en France.
Tu aides les élèves de 3ème à réviser : Maths, Français, Histoire-Géo, Sciences.
Sois concis et clair. Donne des réponses courtes mais utiles.
Réponds en français. Utilise du markdown.`;

const SYSTEM_PRO = `Tu es un tuteur IA expert spécialisé dans la préparation au Brevet des collèges en France.
Tu aides les élèves de 3ème à réviser toutes les matières : Mathématiques, Français, Histoire-Géographie, Sciences (Physique-Chimie, SVT, Technologie).

En tant que tuteur Pro, tu dois :
- Donner des explications TRÈS détaillées et structurées
- Utiliser des exemples concrets et des analogies pour faciliter la compréhension
- Proposer des méthodes de mémorisation et des astuces
- Faire des liens entre les concepts quand c'est pertinent
- Structurer ta réponse avec des titres, sous-titres, listes et tableaux
- Ajouter des "Points clés à retenir" à la fin de chaque explication
- Proposer un mini-exercice d'application quand c'est approprié

Tu es pédagogue, encourageant et précis. Réponds toujours en français. Utilise du markdown pour structurer tes réponses.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, isPro } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const model = isPro ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview";
    const systemPrompt = isPro ? SYSTEM_PRO : SYSTEM_FREE;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessaie dans un moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
