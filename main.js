const { Sonos } = require('sonos')
const express = require('express')
const path = require("path");
const app = express()

const ip = "192.168.172.240"
const device = new Sonos(ip);

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get('/track', async (_, res) => {
  const track = await device.currentTrack();
  const dj = await device.getSpotifyConnectInfo()

  res.json({
    ...track,
    dj: dj.activeUser
  })
})

app.listen(3000, () => console.log('listening on port 3000!'))