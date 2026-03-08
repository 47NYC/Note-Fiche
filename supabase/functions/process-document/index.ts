import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchGoogleDocContent(url: string): Promise<string> {
  // Extract doc ID from various Google Docs URL formats
  const patterns = [
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/open\?id=([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
  ];

  let docId: string | null = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      docId = match[1];
      break;
    }
  }

  if (!docId) throw new Error("Impossible d'extraire l'ID du Google Doc depuis l'URL");

  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
  const response = await fetch(exportUrl);

  if (!response.ok) {
    throw new Error(
      "Impossible d'accéder au Google Doc. Vérifiez que le document est partagé en mode 'Tous ceux qui ont le lien'."
    );
  }

  return await response.text();
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { document_id, google_doc_url } = await req.json();
    if (!document_id) throw new Error("document_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Determine content source
    const docUrl = google_doc_url || doc.google_doc_url;
    let userContent: any[];

    if (docUrl) {
      // Google Docs: fetch text content
      const textContent = await fetchGoogleDocContent(docUrl);
      userContent = [
        {
          type: "text",
          text: `Analyse ce document intitulé "${doc.title}" (matière: ${doc.folder || "non spécifiée"}) et structure son contenu pédagogique complet.\n\nContenu du document:\n\n${textContent}`,
        },
      ];
    } else if (doc.file_path) {
      // PDF: download and convert to base64
      const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
      const { data: fileData, error: dlErr } = await supabase.storage
        .from("documents")
        .download(doc.file_path);
      if (dlErr || !fileData) throw new Error("Failed to download file");
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = base64Encode(new Uint8Array(arrayBuffer));
      userContent = [
        {
          type: "text",
          text: `Analyse ce document PDF intitulé "${doc.title}" (matière: ${doc.folder || "non spécifiée"}) et structure son contenu pédagogique complet.`,
        },
        {
          type: "image_url",
          image_url: { url: `data:application/pdf;base64,${base64}` },
        },
      ];
    } else {
      throw new Error("Aucune source de contenu disponible (ni URL Google Docs, ni fichier)");
    }

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
            { role: "user", content: userContent },
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
                    title: { type: "string", description: "Titre du document structuré" },
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
                          summary: { type: "string", description: "Résumé du chapitre en 2-5 phrases" },
                          questions: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                type: { type: "string", enum: ["qcm", "open"] },
                                question: { type: "string" },
                                options: { type: "array", items: { type: "string" } },
                                answer: { type: "string" },
                                explanation: { type: "string" },
                              },
                              required: ["type", "question", "answer", "explanation"],
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
          tool_choice: { type: "function", function: { name: "structure_document" } },
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
