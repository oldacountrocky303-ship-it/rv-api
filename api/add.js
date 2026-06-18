const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "Rocky-mastermind/rv-api";
const FILE_PATH = "data/videos.json";

const BLOCKED_KEYWORDS = [
  "sex", "porn", "nude", "naked", "xxx", "adult",
  "nsfw", "explicit", "erotic", "hentai"
];

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const method = req.method;
  let videoUrl, secret;

  if (method === "GET") {
    videoUrl = req.query.url;
    secret = req.query.secret;
  } else if (method === "POST") {
    videoUrl = req.body?.videoUrl;
    secret = req.body?.secret;
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (secret !== "rocky_rv_2025") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  if (!videoUrl) {
    return res.status(400).json({ error: "videoUrl required" });
  }

  // শুধু Imgur link allow
  if (!videoUrl.match(/^https?:\/\/i\.imgur\.com\/.+/i)) {
    return res.status(400).json({
      error: "❌ শুধু i.imgur.com এর link দেওয়া যাবে!"
    });
  }

  // Blocked keyword check
  const lowerUrl = videoUrl.toLowerCase();
  const hasBlocked = BLOCKED_KEYWORDS.some(word => lowerUrl.includes(word));
  if (hasBlocked) {
    return res.status(400).json({
      error: "❌ এই ধরনের video add করা যাবে না!"
    });
  }

  try {
    const getFile = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    const currentContent = JSON.parse(
      Buffer.from(getFile.data.content, "base64").toString("utf8")
    );

    const isDuplicate = currentContent.some(v => v.url === videoUrl);
    if (isDuplicate) {
      return res.status(400).json({ error: "❌ এই video আগেই add করা আছে!" });
    }

    currentContent.push({ url: videoUrl });

    await axios.put(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        message: "Add new video via bot",
        content: Buffer.from(
          JSON.stringify(currentContent, null, 2)
        ).toString("base64"),
        sha: getFile.data.sha
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    return res.status(200).json({
      success: true,
      url: videoUrl,
      total: currentContent.length
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
