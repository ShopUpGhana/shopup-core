// supabase/functions/sign-product-images/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Transform = {
  width?: number;
  height?: number;
  resize?: "cover" | "contain" | "fill";
  quality?: number;
};

function buildSignedRenderUrl(signedUrl: string, transform?: Transform) {
  // signedUrl: /storage/v1/object/sign/<bucket>/<path>?token=...
  const u = new URL(signedUrl);
  const token = u.searchParams.get("token");
  if (!token) return signedUrl;

  const marker = "/storage/v1/object/sign/";
  const idx = u.pathname.indexOf(marker);
  if (idx === -1) return signedUrl;

  const after = u.pathname.slice(idx + marker.length); // bucket/<path...>
  const renderPath = "/storage/v1/render/image/sign/" + after;

  const r = new URL(u.origin + renderPath);
  r.searchParams.set("token", token);

  if (transform?.width) r.searchParams.set("width", String(transform.width));
  if (transform?.height) r.searchParams.set("height", String(transform.height));
  if (transform?.resize) r.searchParams.set("resize", transform.resize);
  if (transform?.quality) r.searchParams.set("quality", String(transform.quality));

  return r.toString();
}

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const BUCKET = Deno.env.get("SHOPUP_PRODUCT_IMAGES_BUCKET") || "product-images";

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
    const expiresIn: number = Number(body.expiresIn || 600);
    const transform: Transform | undefined = body.transform;

    if (!paths.length) {
      return new Response(JSON.stringify({ ok: true, map: {} }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const map: Record<string, string> = {};

    // Sign sequentially (stable). You can batch/parallel later.
    for (const path of paths) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, expiresIn);

      if (error || !data?.signedUrl) continue;

      map[path] = buildSignedRenderUrl(data.signedUrl, transform);
    }

    return new Response(JSON.stringify({ ok: true, map }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message || e) }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
