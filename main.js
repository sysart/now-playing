require('dotenv').config()
const { Sonos } = require('sonos')
const express = require('express')
const path = require("path")
const request = require('request')
const SpotifyWebApi = require('spotify-web-api-node')
const app = express()
var http = require('http').Server(app);
const io = require('socket.io')(http);

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

const getTrack = async () => {
  getFridayList();
  const track = await device.currentTrack();

  const dj = await device.getSpotifyConnectInfo()

  if(track.uri.includes('spotify')){
    const re = /:(.+)(?=\?)/
    const spotifyUri = track.uri.match(re)
    const isFridaySong = fridayList.includes(decodeURIComponent(spotifyUri[1]))

    return {
      ...track,
      dj: dj.activeUser,
      isFridaySong
    }
  }

  if(track.uri.includes('Suomipop')){
    return {
      ...track,
      title: "Radio Suomipop",
      albumArtURL: "https://pbs.twimg.com/profile_images/908614679408386048/i9ALMCur_400x400.jpg",
      dj: "",
      isFridaySong: false,
    }
  } else {
    return {
      ...track,
      dj: "....",
      isFridaySong: false,
    }
  }



}


fetchToken = () => {
  return new Promise((resolve, reject) => {
    try {
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

io.on('connection', function(socket){
  console.log('a user connected');
});


setInterval(async () => {
  const t = await getTrack()
  io.emit('track-update', t);
}, 1000)




http.listen(3000, () => console.log('listening on port 3000!'))