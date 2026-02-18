// supabase/functions/get-product-image-urls/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const paths: string[] = Array.isArray(body.paths) ? body.paths.filter(Boolean) : [];
    const expiresIn: number = Number(body.expiresIn || 3600);

    if (!paths.length) {
      return new Response(JSON.stringify({ ok: true, urls: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Safety: limit how many can be signed per call
    const limited = paths.slice(0, 60);

    // Optional: light validation to reduce abuse:
    // Only allow product-images bucket paths that start with "seller/"
    for (const p of limited) {
      if (!String(p).startsWith("seller/")) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid path" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const bucket = "product-images";

    const urls: string[] = [];
    for (const p of limited) {
      const { data, error } = await client.storage.from(bucket).createSignedUrl(p, expiresIn);
      if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (data?.signedUrl) urls.push(data.signedUrl);
    }

    return new Response(JSON.stringify({ ok: true, urls }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "Function failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
