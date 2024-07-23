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
        rel: 0,
        //videoId: 'M7lc1UVf-VE',
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
    player2 = new YT.Player('player2', {
        height: '450',
        width: '800',

        //videoId: 'M7lc1UVf-VE',
        playerVars: {
            'playsinline': 1
        },
        events: {
            //'onReady': onPlayerReady,
            //'onStateChange': onPlayerStateChange
        }
    });
}

function playYoutube(youtube_id, time) {
    player.cueVideoById(youtube_id, time);
    setTimeout(() => {
        player.playVideo();
    }, 300);

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