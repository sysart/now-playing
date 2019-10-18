const fetch = require("node-fetch");

const API_KEY = process.env.GIPHY_KEY;
const url = str =>
  `http://api.giphy.com/v1/gifs/search?q=${encodeURI(
    str
  )}&api_key=${API_KEY}&limit=5`;

const error = err => {
  return console.error(err);
};

async function getImage(str) {
  if (typeof str !== "string") {
    return error("not  string");
  }

  if (str.length === 0) {
    return error("Give longer string");
  }

  const res = await fetch(url(str));
  const json = await res.json();

  if (json.meta.status === 200) {
    return json.data.map(d => d.embed_url)[0];
  }

  return error(json.meta.msg);
}

module.exports = getImage;
