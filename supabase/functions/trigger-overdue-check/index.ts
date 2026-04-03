import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { cors } from "https://deno.land/std@0.224.0/http/middleware/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors_headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, api-key, content-type",
};

serve(async (req) => {
  // In a real-world scenario, you'd want to add authentication/authorization here
  // to ensure only authorized schedulers can call this function.
  // For example, check a secret header or API key.

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY"); // Use Service Key for backend operations

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL or Service Key not found in environment variables.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), {
      status: 500,
      headers: { ...cors_headers, "Content-Type": "application/json" },
    });
  }

  const client = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data, error } = await client.rpc('check_overdue_payments');

    if (error) {
      console.error("Error calling check_overdue_payments:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...cors_headers, "Content-Type": "application/json" },
      });
    }

    console.log("check_overdue_payments executed successfully.");
    // The RPC returns VOID, so 'data' will be null. We return a success message.
    return new Response(JSON.stringify({ message: "Overdue payments checked and notifications sent if applicable." }), {
      status: 200,
      headers: { ...cors_headers, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error in Edge Function:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors_headers, "Content-Type": "application/json" },
    });
  }
}, {
  middleware: {
    fetch: cors({
      origin: "*",
      allowedHeaders: ["authorization", "x-client-info", "api-key", "content-type"],
    }),
  },
});
