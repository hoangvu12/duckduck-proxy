import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";

const PORT = process.env.PORT || 3000;

interface ChatPayload {
  messages: any[];
  model: string;
}

const syntheticHeaders = {
  accept: "application/json",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  "content-type": "application/json",
  pragma: "no-cache",
  priority: "u=1, i",
  "sec-ch-ua": '"Not?A_Brand";v="99", "Chromium";v="130"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  cookie: "dcm=3",
  Referer: "https://duckduckgo.com/",
  "Referrer-Policy": "origin",
};

new Elysia()
  .use(cors())
  .get("/", "Hello Elysia")
  .post("/api/chat", async ({ body, headers, set }) => {
    const { messages, model } = body as ChatPayload;

    if (!messages || !model) {
      set.status = 400;
      return {
        success: false,
        error: "Missing messages or model",
      };
    }

    let vqdToken;
    try {
      if (headers["x-vqd-4"]) {
        vqdToken = headers["x-vqd-4"];
      } else {
        const res = await fetch(`https://duckduckgo.com/duckchat/v1/status`, {
          headers: {
            "x-vqd-accept": "1",
            ...syntheticHeaders,
          },
        });
        vqdToken = res.headers.get("x-vqd-4");
      }

      const response = await fetch(`https://duckduckgo.com/duckchat/v1/chat`, {
        method: "POST",
        body: JSON.stringify({
          messages,
          model,
        }),
        headers: {
          ...syntheticHeaders,
          "X-Vqd-4": `${vqdToken}`,
        },
      });

      if (response.body) {
        set.headers["X-Vqd-4"] = response.headers.get("x-vqd-4") || "";
        return response.body;
      }
    } catch (error) {
      set.status = 500;
      return {
        success: false,
        error: error,
      };
    }
  })
  .listen(PORT);

console.log(`Server is running on http://localhost:${PORT}`);
