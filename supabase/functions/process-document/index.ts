import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { document_id } = await req.json();
    if (!document_id) throw new Error("document_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get document info
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", document_id)
      .single();
    if (docErr || !doc) throw new Error("Document not found");

    // Check if already processed
    const { data: existing } = await supabase
      .from("structured_documents")
      .select("id")
      .eq("document_id", document_id)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Document déjà traité", existing_id: existing.id }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download PDF from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from("documents")
      .download(doc.file_path);
    if (dlErr || !fileData) throw new Error("Failed to download file");

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = base64Encode(new Uint8Array(arrayBuffer));

    // Send to AI for structuring
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `Tu es un assistant pédagogique expert pour des élèves de 3ème préparant le brevet. Analyse le document fourni et structure son contenu pédagogique de manière exhaustive. Extrais tous les concepts, dates, définitions, et crée des questions pertinentes.`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyse ce document PDF intitulé "${doc.title}" (matière: ${doc.folder || "non spécifiée"}) et structure son contenu pédagogique complet.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${base64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "structure_document",
                description:
                  "Structure le contenu d'un document pédagogique en chapitres avec questions, définitions, dates et éléments géographiques",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Titre du document structuré",
                    },
                    subject: {
                      type: "string",
                      description:
                        "Matière (Mathématiques, Français, Histoire-Géo EMC, Sciences (SVT), Physique-Chimie, Anglais, Espagnol, etc.)",
                    },
                    chapters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          summary: {
                            type: "string",
                            description: "Résumé du chapitre en 2-5 phrases",
                          },
                          questions: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                type: {
                                  type: "string",
                                  enum: ["qcm", "open"],
                                },
                                question: { type: "string" },
                                options: {
                                  type: "array",
                                  items: { type: "string" },
                                  description:
                                    "Options pour QCM (4 choix). Vide pour questions ouvertes.",
                                },
                                answer: { type: "string" },
                                explanation: { type: "string" },
                              },
                              required: [
                                "type",
                                "question",
                                "answer",
                                "explanation",
                              ],
                            },
                          },
                          definitions: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                term: { type: "string" },
                                definition: { type: "string" },
                              },
                              required: ["term", "definition"],
                            },
                          },
                          dates: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                date: { type: "string" },
                                event: { type: "string" },
                              },
                              required: ["date", "event"],
                            },
                          },
                          geo_elements: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                element: { type: "string" },
                                description: { type: "string" },
                              },
                              required: ["element", "description"],
                            },
                          },
                        },
                        required: ["title", "summary"],
                      },
                    },
                  },
                  required: ["title", "subject", "chapters"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "structure_document" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Pas de réponse structurée de l'IA");

    const structured = JSON.parse(toolCall.function.arguments);

    // Save to DB
    const { data: saved, error: saveError } = await supabase
      .from("structured_documents")
      .insert({
        document_id: doc.id,
        title: structured.title,
        subject: structured.subject || doc.folder || "",
        content: { chapters: structured.chapters || [] },
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify(saved), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
