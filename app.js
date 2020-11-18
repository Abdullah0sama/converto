const axios = require("axios").default;
const express = require("express");
var app = express();
var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
var SpotifyWebApi = require("spotify-web-api-node");
const { compile } = require("ejs");
app.set("view engine", "ejs");


var clientId = process.env.clientId;
var clientSecret = process.env.clientSecret;
var redirect_uri = process.env.redirect_uri;
var refreshToken = process.env.refreshToken;
var scopes = "playlist-modify-public";


var spotifyApi = new SpotifyWebApi({
    clientId: clientId,
    clientSecret: clientSecret,
});
spotifyApi.setRefreshToken(refreshToken);
spotifyApi.refreshAccessToken().then(
    function(data) {
        console.log('The access token has been refreshed!');
      // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
        console.log('Could not refresh access token', err);
    }
);

async function searchTracks(array){
    var toBeReturned = [];
    for(let i =0;i<array.length;++i){
        var y = await search(array[i]);
        if(y) toBeReturned.push(y);
    }
    return toBeReturned;
}
async function search(track){
    var x;
    var responce = await spotifyApi.searchTracks(`track:${track.name} artist:${track.artists[0]}`)
    .then(function(data) {
        for(let i = 0; i< data.body.tracks.items.length;++i){
            // console.log(searchTrack.name, searchTrack.id);
            // searchTrack.artists.forEach(function (param) { return console.log(param.name) });
            if(data.body.tracks.items[i].name == track.name){
                x = "spotify:track:" + String(data.body.tracks.items[i].id);   
                break;            
            }
        }
    })
    .catch(function(err){
        console.log("error", err);
    }); 
    return x;
}
async function add(id, toBeAdded){
    var idReturn = "mno";
    console.log(toBeAdded);
    var x = await spotifyApi.addTracksToPlaylist(id, toBeAdded).then(function (data) {  
            idReturn = data.body.snapshot_id;
            console.log("added successfully", data.body.snapshot_id);
        }).catch(function (error) {  
            console.log("problem", error);
        });
    return idReturn;
}
async function create (playlist) {
    var x = "empty";  
    await spotifyApi.createPlaylist("nmvkw4arerrl6x1errmycjkoq",playlist.name, {public:true, description:"Made By ConvertO"}).then(function (param) {  
        x =  param.body.id;
    })
    return x;
}
var spotify = {
    getId:function(link){
        var playlist = {
            name: "",
            tracksInfo: []
        };
        if(link.includes("/open.spotify.com/playlist/")){
            console.log("OK");
            let start = link.indexOf("playlist/") + 9;
            let end = link.indexOf("?");
            var playlistID = link.substring(start, end);
            return playlistID;
        }else{
            console.log("NOT OK");
        }
    },
    getTracks:async function (playlistId) {  
        var response =[];
        response = await spotifyApi.getPlaylist(playlistId).then(function (data) {
            return data; 
        })
        .then(function (data) { 
            playlist = {
                name:"",
                tracks:[],
            };
            playlist.name = data.body.name;
            data.body.tracks.items.forEach(element => {
                artists = [];
                element.track.artists.forEach(artist => {
                    artists.push(artist.name);
                });
                playlist.tracks.push({
                    artists:artists, 
                    name:element.track.name
                });
            });
            return playlist;
        })
        .catch(function (err) {
            console.log("error", err);
        });
        return response;
    },
    create: async function(playlist){
        var newPlaylistLink;
        var toBeAdded = await searchTracks(playlist.tracks);
        var id = await create(playlist);
        var x = await add(id, toBeAdded);
        console.log("create",id);
        return id;
    },
    getLink: async function (playlist) {
        var x = await spotify.create(playlist);
        return x;
    }
}

app.get("/deezer", function(req, res){
    console.log(req);
})
app.get("/", function(req, res){
    console.log(req);
    if(req.query.link){
        var albumId = spotify.getId(req.query.link);
        var tracks = spotify.getTracks(albumId);
        tracks.then(function (data) { 
            var y = spotify.getLink(data);
            y.then(function (id) {  
                res.render("Home", {playlist:data, link:"https://open.spotify.com/playlist/"+id});
            });
        }).catch(function (err) { 
            console.log("error", err);
        });
    }else{
        console.log("fail");
        res.render("Home", {playlist:{name:" ",
        tracks : []
    }, link:""});
    }
});


    
app.listen(process.env.PORT, function () {  
    console.log("CovertO Server has started!");
});
