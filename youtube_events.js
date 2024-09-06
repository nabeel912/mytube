
var player;
var player2;
var done = false;
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);



// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '585',
        width: '1040',
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });

    player2 = new YT.Player('player2', {
        height: '585',
        width: '1040',
        playerVars: {
            'playsinline': 1
        },
        events: {
        }
    });
}

var players = {};
var ready_functions = {};
function get_youtube_info(youtube_id) {
    return new Promise((resolve) => {
        var player_id = get_new_id();
        ready_functions[player_id] = function() {
            var title = players[player_id].getVideoData().title;
            var author = players[player_id].getVideoData().author;
            var duration = players[player_id].getDuration();
            var item = { youtube_id: youtube_id, title: title, duration: duration, author: author };
            delete players[player_id];
            $(`#player_${player_id}`).remove();
            resolve(item)
        }
        $('body').append(`<div id="player_${player_id}" style="display: none;"></div>`);
        players[player_id] = new YT.Player(`player_${player_id}`, {
            videoId: youtube_id,
            events: {
                'onReady': ready_functions[player_id],
                //'onStateChange': onPlayerStateChange
            }
        });
    })
}

function playYoutube(youtube_id, time) {
    player.loadVideoById(youtube_id, time);
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    //event.target.playVideo();
    youtube_is_ready();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING && !done) {
        done = true;
    }
}
function stopVideo() {
    player.stopVideo();
}

function pauseVideo() {
    player.pauseVideo();
}
function seekVideo(time) {
    player.seekTo(time, true);
}
function getSeekTime() {
    return player.getCurrentTime();
}
function getVideoTitle() {
    return player.getVideoData().title;
}
function getVideoDuration() {
    return player.getDuration();
}

function getYoutubeId(url){
    var match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/);
    return (match&&match[7].length==11)?match[7]:false;
}