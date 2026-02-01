// Zero-dependency health check using native Deno APIs
console.log("Function scope executed");

Deno.serve(async (req) => {
    console.log("Request received via Deno.serve");
    return new Response(JSON.stringify({ message: "Hello from Zero-Dep Function" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
    });
});
