const axios = require("axios").default;
const express = require("express");
var app = express();
var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

app.set("view engine", "ejs");

var Deezer = require("./deezer");
var Spotify = require("./spotify");




app.get("/deezer", function(req, res){
    console.log(req.body);
    res.redirect("/");
});

var input = {
    'spotify': Spotify.getPlaylist,
    'deezer': Deezer.getPlaylist
};
var id = {
    'spotify': Spotify.getId,
    'deezer': Deezer.getId
}
var output = {
    'deezer': Deezer.createPlaylist,
    'spotify': Spotify.createPlaylist
}
var link = {
    'deezer': 'https://www.deezer.com/en/playlist/',
    'spotify': 'https://open.spotify.com/playlist/'
}

app.get("/", async function(req, res){
    res.render("Home");
});

app.post("/", function(req, res){
    var outPlaylist = req.body.output;
    var inLink = req.body.link;
    var inPlaylist = inLink.includes("spotify") ? "spotify" : inLink.includes("deezer") ? "deezer" : undefined;
    
    if(inLink &&  inLink.includes(inPlaylist)){

        input[inPlaylist](id[inPlaylist](inLink))
        .then(res => output[outPlaylist](res))
        .then(id => {
            res.render("Home", {playlist: inPlaylist, link: link[outPlaylist] + id});
        })
        .catch(err => console.log(err));
        
    }else res.redirect("/");
    
});

    
app.listen(process.env.PORT, function () {  
    console.log("replicalist Server has started!");
});

