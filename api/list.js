const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "Rocky-mastermind/rv-api";
const FILE_PATH = "data/videos.json";

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    const getFile = await axios.get(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    const videos = JSON.parse(
      Buffer.from(getFile.data.content, "base64").toString("utf8")
    );
    return res.status(200).json({ total: videos.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
