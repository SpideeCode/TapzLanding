import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log("[HEALTH CHECK] Webhook invoked successfully via Stripe!");
    console.log("[HEALTH CHECK] Method:", req.method);

    try {
        const body = await req.text();
        console.log("[HEALTH CHECK] Body received (Length):", body.length);
    } catch (e) {
        console.error("[HEALTH CHECK] Failed to read body:", e);
    }

    return new Response(JSON.stringify({ message: "Hello from Supabase Edge Function! System is ONLINE." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
    });
});
