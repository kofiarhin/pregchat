const HF_ENDPOINT =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateImageBuffer = async (prompt) => {
  if (!process.env.HUGGING_FACE_API_KEY) {
    throw new Error("HUGGING_FACE_API_KEY is not configured");
  }

  const headers = {
    Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    inputs: prompt,
    options: { wait_for_model: true },
  });

  const maxAttempts = 2;
  let attempt = 0;
  let lastError = null;

  while (attempt < maxAttempts) {
    try {
      const response = await fetch(HF_ENDPOINT, {
        method: "POST",
        headers,
        body,
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      const errorPayload = await response.text();
      const error = new Error(
        `Hugging Face request failed with status ${response.status}`
      );
      error.status = response.status;
      error.payload = errorPayload;

      if (response.status === 503 && attempt + 1 < maxAttempts) {
        await sleep(500 * (attempt + 1));
        attempt += 1;
        lastError = error;
        continue;
      }

      throw error;
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      if (attempt + 1 >= maxAttempts) {
        throw error;
      }

      lastError = error;
      await sleep(500 * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError ?? new Error("Image generation failed");
};

module.exports = {
  generateImageBuffer,
};
