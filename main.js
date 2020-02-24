require("dotenv").config();
const { Sonos } = require("sonos");
const express = require("express");
const path = require("path");
const app = express();
var http = require("http").Server(app);
const io = require("socket.io")(http);

const ip = process.env.SONOS_IP;
console.log("Use sonos IP ", ip);
const device = new Sonos(ip);

const getImage = require("./getImage");

app.get("/giphy/", async (req, res) => {
  const str = req.query.s;

  const image = await getImage(str);

  io.emit("show-image", { image, text: str });

  res.send(`sent ${str} -> ${image}`);
});

app.use("/", express.static("public"));

const getTrack = async () => {
  try {
    const track = await device.currentTrack();

    if (track.uri && track.uri.includes("spotify")) {
      return {
        ...track,
        dj: " Null ",
        isFridaySong: false
      };
    }

    return {
      ...track,
      dj: "....",
      isFridaySong: false
    };
  } catch (error) {
    console.error("Error getting track ", error);
  }
};

io.on("connection", function(socket) {
  console.info("a user connected");
});

setInterval(async () => {
  const t = await getTrack();
  io.emit("track-update", t);
}, 1000);

http.listen(3000, () => console.log("listening on port 3000!"));
