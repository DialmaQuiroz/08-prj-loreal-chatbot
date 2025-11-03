// IMPORTANT: You must set your OpenAI API key as a secret named OPENAI_API_KEY
// In the Cloudflare dashboard, go to your Worker > Settings > Add Secret > Name: OPENAI_API_KEY > Value: your-api-key

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Check if API key is set
    if (!env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Missing OpenAI API key. Please set the OPENAI_API_KEY secret in your Cloudflare Worker settings.",
        }),
        { headers: corsHeaders, status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const userInput = await request.json();

    const requestBody = {
      model: "gpt-4o",
      messages: userInput.messages,
      max_tokens: 300,
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  },
};
