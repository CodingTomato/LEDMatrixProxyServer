const axios = require('axios').default;

const express = require('express')
const app = express()
 
const key = "BQBxiqnig1OpAPSWD4hmVsQISAYQ12NoHOjeFHerLzhM8kxMXQtVP0Y32ug3xqpzPrTIiQnDFwuhOhj7T1MV4j8zn4NpK6E-W379Fo6qFKAz7ko_oTInwK5BjYU2O49KUXuWa5Jc59QayCs0KkihzQ"

app.get('/getPlayingPicture', function (req, res) {
    axios.get('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${key}` } })
    .then(function (response) {
      // handle success
      console.log(response.status);
      if(response.status == 204) {
        console.log("Nix is playing");
        res.sendStatus(204);
      } else if(response.status == 200 && response.data != '') {
        console.log("Found Song", response.data.item.id);
        const songid = response.data.item.id;

        axios.get('https://api.spotify.com/v1/tracks/'+songid, { headers: { Authorization: `Bearer ${key}` } })
        .then(function (response) {
            response.data.album.images.forEach(image => {
                if(image.height == 64 && image.width == 64) {
                    console.log("Found image!", image.url)
                    res.send(image.url);
                }
            });
        })
        .catch(function (error) {
        console.log(error);
        res.sendStatus(204);
        })
      } else {
        console.log("Nix is playing");
        res.sendStatus(204);
      }
    })
    .catch(function (error) {
      // handle error
      console.log(error);
      res.sendStatus(500);
    })
});

app.get('/getTime', function (req, res) {
    res.send(Date.now().toString());
});
 
app.listen(3000)