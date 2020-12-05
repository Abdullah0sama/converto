const axios = require("axios").default;

var app_id = "446382";
var secret_key  = "3754f3eddd7087eeeccdbdc645600b20"
var redirect_uri = "https://convert-o.herokuapp.com/deezer";
var perms = "offline_access,manage_library";
var code = "frbe30bf568f62ae0b882125e711f315";
var access_token = "frVytosemR1yRA5JFGZiwe8cjp7pjsPWUeZrAfPwAB0SDF76ba";

var me = "3882746022";
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
    .catch(err => console.log(err));
    return playlistInfo;
}

Deezer.createPlaylist = async function (playlistInfo){

    //creating the playlist and returning back the id
    var playlistId = await axios.post(`https://api.deezer.com/user/${me}/playlists`, {}, {
        params: {
            access_token: access_token,
            title: playlistInfo.title
        }
    })
    .then(res => res.data.id)
    .catch(err => console.log(err));

    //search for the tracks in deezer and returns an array with their ids
    var tracks = playlistInfo.tracksInfo;
    var tracksId = [];
    await Promise.all(tracks.map( (track) => {
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
    .then(res => tracksId = res);

    //add tracks to the playlist using track ids
    await axios.post(`https://api.deezer.com/playlist/${playlistId}/tracks`, {}, {
        params: {
            access_token: access_token,
            songs: tracksId.join(",")
        }
    })
    .then(res => console.log(res.data))
    .catch(err => console.log(err));

    return playlistId;
}

module.exports = Deezer;


