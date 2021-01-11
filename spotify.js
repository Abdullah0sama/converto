const axios = require("axios").default;

var clientId =          process.env.spotify_clientId;
var clientSecret =      process.env.spotify_clientSecret;
var redirect_uri =      process.env.spotify_redirect_uri;
var refreshToken =      process.env.spotify_refreshToken;
var scopes =            process.env.spotify_scopes;
var me =                process.env.spotify_me;

var token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
var accessToken;

var Spotify = {};

function refreshAccessToken(){
    return axios.post("https://accounts.spotify.com/api/token", `grant_type=refresh_token&refresh_token=${refreshToken}`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${token}`,
        },
    })
    .then(res => accessToken = res.data.access_token)
    .catch(err => console.log(err.response));
}

//gets id from the url
Spotify.getId = function(link){
    return link.split("/")[4];
}
//get playlist title and tracks information
//outputs an object with title:String
//tracksInfo: [{title: String, artist:String, album: String},..,...]
Spotify.getPlaylist = async function (id){

    await refreshAccessToken();

    var playlistInfo = {
        title: '',
        // objects in tracksInfo should be stored in the form of 
        //{title: String,
        // artist: String,
        // album: String
        //}
        tracksInfo: []
    }
    
    //gets playlist info using the playlist's id 
    //It gets playlist title and tracks info (title, artist, album)
    await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
        params: {
            fields: "name, tracks.items(track(name, album(name), artists(name)))"
        }
    })
    .then(res => {
        playlistInfo.title = res.data.name;
        
        res.data.tracks.items.forEach(ele => playlistInfo.tracksInfo.push({
            title: ele.track.name,
            artist: ele.track.artists[0].name,
            album: ele.track.album.name 
        }));
    })
    .catch(err => console.log("error get"));
    
    return playlistInfo;
}

//creating playlist and returning playlist id
function initPlaylist(title){
    return axios.post(`https://api.spotify.com/v1/users/${me}/playlists`, {
        name: title
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': "application/json"
        },
    })
    .then(res => res.data.id)
    .catch(err => console.log("error id"));
}

//search for the tracks and return an array with ids for the found tracks
function search(tracks){
    return  Promise.all(tracks.map( (track) => {
        return axios.get(`https://api.spotify.com/v1/search`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                q: `track:"${track.title}"album:"${track.album}"artist:"${track.artist}"`,
                type: 'track'
            }
        })
        .then(res => {
            for(var i = 0; i < res.data.tracks.total; ++i){
                if(res.data.tracks.items[i].name == track.title){
                    return "spotify:track:" + res.data.tracks.items[i].id;
                }
            }
        })
        .catch(err => console.log(err));
    }))
    .then(res => res);
}
//adds tracks to the playlist using an array of their ids
function addTracks(playlistId, tracksId){
    return axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        uris: tracksId
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': "application/json"
        }
    })
    .then(res => console.log(res.statusText))
    .catch(err => console.log(err));
}

//creates a playlist using playlistInfo and returns created playlist id
Spotify.createPlaylist = async function(playlistInfo){
    await refreshAccessToken();
    
    var playlistId = await initPlaylist(playlistInfo.title);
    
    var tracksId = await search(playlistInfo.tracksInfo);
    
    //remove undefined from the array
    tracksId = tracksId.filter(function(x) {
        return x !== undefined;
    });
    
    await addTracks(playlistId, tracksId);
    
    return playlistId;
}


module.exports = Spotify;