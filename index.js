const axios = require('axios').default;
require('dotenv').config()

const express = require('express')
const app = express()

let state = 0;
const redirect_uri = process.env.REDIRECT_URI;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

let rec_code = "";

let token = "";
let refresh_token = "";
let expires_in = 0;

let refreshInterval = 0;

app.get('/getPlayingPicture', function (req, res) {
    axios.get('https://api.spotify.com/v1/me/player/currently-playing', { headers: { Authorization: `Bearer ${token}` } })
        .then(function (response) {
            // handle success
            console.log(response.status);
            if (response.status == 204) {
                console.log("Nix is playing");
                res.sendStatus(204);
            } else if (response.status == 200 && response.data != '') {
                console.log("Found Song", response.data.item.id);
                const songid = response.data.item.id;

                axios.get('https://api.spotify.com/v1/tracks/' + songid, { headers: { Authorization: `Bearer ${token}` } })
                    .then(function (response) {
                        response.data.album.images.forEach(image => {
                            if (image.height == 64 && image.width == 64) {
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

app.get('/login', function (req, res) {
    state = Math.round(Math.random() * 999999);
    const scopes = 'user-read-currently-playing user-read-playback-state';
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&state=' + state +
        '&client_id=' + client_id +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

app.get('/auth-success', function (req, res) {
    rec_code = req.query.code;
    if (state == req.query.state) {
        // Start Token Request
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', rec_code);
        params.append('redirect_uri', redirect_uri);

        axios.post(
            'https://accounts.spotify.com/api/token', 
            params, 
            { headers: { Authorization: `Basic ${Buffer.from(client_id + ":" + client_secret).toString('base64')}` } }
        )
            .then(function (response) {
                if (response.status == 200) {
                    token = response.data.access_token;
                    refresh_token = response.data.refresh_token;
                    expires_in = response.data.expires_in;

                    refreshInterval = setInterval(refreshOauthToken, (expires_in-200)*1000)

                    res.send("success! " + token);
                } else {
                    res.sendStatus(401);
                }
            })
            .catch(function (error) {
                console.log(error);
                res.send(error);
            });
    } else {
        res.sendStatus(401);
    }
});

app.get('/getTime', function (req, res) {
    res.send(Date.now().toString());
});

function refreshOauthToken(){
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refresh_token);

    axios.post(
        'https://accounts.spotify.com/api/token', 
        params, 
        { headers: { Authorization: `Basic ${Buffer.from(client_id + ":" + client_secret).toString('base64')}` } }
    )
        .then(function (response) {
            if (response.status == 200) {
                token = response.data.access_token;
                //refresh_token = response.data.refresh_token;
                expires_in = response.data.expires_in;

                refreshInterval = setInterval(refreshOauthToken, (expires_in-200)*1000)

                console.log("success! ");
            } else {
                console.error("error!")
            }
        })
        .catch(function (error) {
            console.log(error);
            console.error(error);
        });
}

app.listen(3000)