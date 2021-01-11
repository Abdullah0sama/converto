const axios = require("axios").default;

var app_id =                process.env.deezer_app_id;
var secret_key  =           process.env.deezer_secret_key;
var redirect_uri =          process.env.deezer_redirect_uri;
var perms =                 process.env.deezer_perms;
var code =                  process.env.deezer_code;
var access_token =          process.env.deezer_access_token;
var me =                    process.env.deezer_me;

var Deezer = {};

// axios.get(`https://connect.deezer.com/oauth/auth.php?app_id=${app_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&perms=${perms}`)
// .then(response => console.log(response))
// .catch(err => console.log(err));

// axios.get(`https://connect.deezer.com/oauth/access_token.php?app_id=${app_id}&secret=${secret_key}&code=${code}`)
// .then(response => console.log(response))
// .catch(err => console.log(err));

Deezer.getId = function(link){
    return link.split("/")[5];
}

Deezer.getPlaylist = async function (id){
    var playlistInfo = {
        title: '',
        // objects in tracksInfo should be stored in the form of 
        //{title: String,
        // artist: String,
        // album: String
        //}
        tracksInfo: []
    };

    //gets playlist info using the playlist's id 
    //It gets playlist title and tracks info (title, artist, album)
    await axios.get("https://api.deezer.com/playlist/" + id)
    .then(response => {
        playlistInfo.title = response.data.title;
        var tracks = response.data.tracks.data;
        tracks.forEach(track => {
            playlistInfo.tracksInfo.push({
                title: track.title,
                artist: track.artist.name,
                album: track.album.title
            });
        });
    })
    .catch(err => console.log(err, "HERE"));
    return playlistInfo;
};

//creating the playlist and returning back the id
function initPlaylist(title){
    return axios.post(`https://api.deezer.com/user/${me}/playlists`, {}, {
        params: {
            access_token: access_token,
            title: title
        }
    })
}

//add tracks to the playlist using track ids
function addTracks(playlistId, tracksId){
    return axios.post(`https://api.deezer.com/playlist/${playlistId}/tracks`, {}, {
        params: {
            access_token: access_token,
            songs: tracksId.join(",")
        }
    })
}
//search for the tracks in deezer and returns an array with their ids
function search(tracksInfo){
    return Promise.all(tracksInfo.map( (track) => {
        return axios.get(`https://api.deezer.com/search`, {
            params: {
                access_token: access_token,
                q: `track:"${track.title}"album:"${track.album}"artist:"${track.artist}"`
            }
        })
        .then(res => {
            for(var i = 0; i < res.data.total; ++i){
                if(res.data.data[i].title == track.title){
                    return res.data.data[i].id;
                }
            }
        })
        .catch(err => console.log(err));
    }))
    .then(res => res);
}
Deezer.createPlaylist = async function (playlistInfo){

    var playlistId = await initPlaylist(playlistInfo.title)
    .then(res => res.data.id)
    .catch(err => console.log(err));

    var tracksId = await search(playlistInfo.tracksInfo);

    await addTracks(playlistId, tracksId)
    .then(res => console.log(res.data))
    .catch(err => console.log(err));
    
    return playlistId;
}


module.exports = Deezer;


