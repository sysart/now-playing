require('dotenv').config()
const { Sonos } = require('sonos')
const express = require('express')
const path = require("path")
const request = require('request')
const SpotifyWebApi = require('spotify-web-api-node')
const app = express()

const ip = "192.168.172.240"
const device = new Sonos(ip)

const clientId = process.env.clientId
const clientSecret = process.env.clientSecret
const redirectUri = 'localhost:3000'

const spotifyApi = new SpotifyWebApi({
  clientId,
  clientSecret,
  redirectUri
})

let token = null;
let fridayList = []

app.get('/', (_, res) => res.sendFile(path.join(__dirname, 'index.html')))

app.get('/track', async (_, res) => {
  getFridayList();
  const track = await device.currentTrack();
  const dj = await device.getSpotifyConnectInfo()

  const re = /:(.+)(?=\?)/
  const spotifyUri = track.uri.match(re)
  const isFridaySong = fridayList.includes(decodeURIComponent(spotifyUri[1]))

  res.json({
    ...track,
    dj: dj.activeUser,
    isFridaySong
  })
})

fetchToken = () => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Fetch token")
      const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
          Authorization:
            'Basic ' +
            new Buffer(clientId + ':' + clientSecret).toString('base64')
        },
        form: {
          grant_type: 'client_credentials'
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          resolve(body.access_token)
        }
      });
    } catch (error) {
      console.log(error)
      reject('No tokenz')
    }
  })

}

getFridayList = async() => {
  if(fridayList.length > 0) return
  if (token == null) {
    token = await fetchToken()
  }

  spotifyApi.setAccessToken(token);
  const list = await spotifyApi.getPlaylist('jonikiiskinen', '7zbIctats0MGzBO2vtPFiv')

  fridayList = list.body.tracks.items.map(t => t.track.uri)
}


app.listen(3000, () => console.log('listening on port 3000!'))