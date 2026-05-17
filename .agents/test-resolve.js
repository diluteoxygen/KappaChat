async function resolveLiveVideoId(urlOrChannel) {
  let url = urlOrChannel.trim();

  // If it's already just a video ID (11 chars), return it
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Format shorthand channel handles like '@username' or 'username'
  if (!url.startsWith("http")) {
    const handle = url.startsWith("@") ? url : `@${url}`;
    url = `https://www.youtube.com/${handle}/live`;
  }

  // If it's a channel URL but doesn't end with /live or have a video ID
  if (url.includes("youtube.com") && !url.includes("watch?v=") && !url.includes("/live/") && !url.includes("/embed/")) {
    if (!url.endsWith("/live")) {
      url = url.replace(/\/$/, "") + "/live";
    }
  }

  console.log("Resolving URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return null;

    const html = await res.text();

    // 1. Try canonical link watch?v= or /live/
    const canonicalMatch = html.match(/<link rel="canonical"[^>]*href="[^"]*(?:watch\?v=|\/live\/)([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) {
      return canonicalMatch[1];
    }

    // 2. Try matching any link to watch?v= or /live/ in the html
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return watchMatch[1];
    }

    const livePathMatch = html.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (livePathMatch) {
      return livePathMatch[1];
    }
  } catch (err) {
    console.error("Failed to resolve live video ID:", err);
  }

  return null;
}

async function run() {
  const tests = [
    "https://www.youtube.com/@LofiGirl",
    "https://www.youtube.com/@LofiGirl/live",
    "@LofiGirl",
    "LofiGirl"
  ];
  for (const t of tests) {
    console.log("Input:", t);
    const id = await resolveLiveVideoId(t);
    console.log("Resolved Video ID:", id);
    console.log("------------------------");
  }
}
run();
