s_videos_times = {};
var cached_calls = JSON.parse(localStorage.getItem('cached_calls') || '{}');

function get_url(term, order) {
    url = `https://www.googleapis.com/youtube/v3/search?part=snippet&key={key}&maxResults=50&q={search}&type=video`
    url = url.replace("{search}", encodeURIComponent(term));
    //url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&key={key}&maxResults=50&q={search}&type=video&chart=mostPopular&regionCode=SA`;
    if(order) {
        url += `&order=${order}`;
    }
    return url;
}

function search_youtube(term, order) {
    return new Promise((resolve) => {
        var url = get_url(term, order);

        if (cached_calls[url]) {
            resolve(cached_calls[url]);
        } else {
            var the_url = url.replace('{key}', 'AIzaSyCI2wJIGo7p1gMx8rZGFlraoPpKHsKKYPU');
            $.ajax({
                url: the_url,
                dataType: "jsonp",
                success: function (data) {
                    cached_calls[url] = data;
                    localStorage.setItem('cached_calls', JSON.stringify(cached_calls));
                    resolve(data);
                }
            });
        }
    })
}

var old_suggests = {};
function do_auto_suggest(term) {
    return new Promise((resolve) => {
        var old_suggests = localStorage.getItem('old_suggests') || '{}';
        old_suggests = JSON.parse(old_suggests);        
        if (old_suggests[term]) {
            resolve(old_suggests[term]);
        } else {
            var url = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&hl=en&gl=sa&sugexp=ytp13nsb_e500%2Cytpo.bo.sb%3D500%2Cytposo.bo.sb%3D500&gs_rn=64&gs_ri=youtube&tok=jAmUOyb7aQJDzsMspIzQ8w&ds=yt&cp=10&gs_id=1a&q=${term}&callback=google.sbox.p50&gs_gbg=9q6E17PEhMGtU`;
            $.ajax({
                url: url,
                dataType: "jsonp",
                success: function (data) {
                    old_suggests[term] = data;
                    localStorage.setItem('old_suggests', JSON.stringify(old_suggests));
                    resolve(data);
                }
            });
        }
    });
}
async function auto_suggest(term) {
    var result = await do_auto_suggest(term);
    var results = [];
    for(var item of result[1]) {
        results.push(item[0]);
    }
    return results;
}

function close_search() {
    player2.pauseVideo();
    document.getElementById('modal_search').style.display = 'none';
}
var current_search_items = [];
$(function () {
    document.getElementById("txt_search").addEventListener("input", function (event) {
        if (event.inputType == "insertReplacementText" || event.inputType == null) {
            $('#txt_search').val(event.target.value);
            $('#btn_search').click();
        }
    })

    $('[action="search"]').click(function () {
        player.pauseVideo();
        $('#modal_search').show();
    })

    $('#btn_search').click(async function () {
        var search = $('#txt_search').val();
        var order = $('#sel_order').val();
        var result = await search_youtube(search, order);
        var items = result.items;
        var html_items = [];
        current_search_items = [];
        for (var item of items) {
            var youtube_id = item.id.videoId || item.id;
            if (youtube_id) {
                var title = item.snippet.title;
                var description = item.snippet.description;
                var image = item.snippet.thumbnails.default.url;
                var date = item.snippet.publishTime;
                current_search_items.push({youtube_id: youtube_id, title: title, image: image, description: description, date: date});

                var css_class = "ltr";
                if (is_arabic(title)) {
                    css_class = "rtl";
                }
                html_items.push(`
                    <li class="w3-bar" youtube-id="${youtube_id}">
                        <div class="w3-row ${css_class}">
                            <div class="w3-col" style="width: 130px">
                                ${timeSince(new Date(date))}
                                <br />
                                <img src="${image}" />
                            </div>
                            <div class="w3-col" style="width: calc(100% - 190px)">
                                <h4 title>${title}</h4>
                                <span description>${description}</span>
                            </div>
                            <div class="w3-rest">
                                <button class="w3-button w3-blue w3-right" add-search-item style="margin-top: 15px">Add</button>
                            </div>
                        </div>
                    </li>`);
            }

        }
        $('#search_results').html(html_items.join(''));
        $('#search_results')[0].scrollTop = 0;
        
               //add to recent plays
        var item = recent_searchs.find(obj => {
            return obj.term == search && obj.order == order
        });
        if(!item) {
            recent_searchs.push({term: search, order: order});
            localStorage.setItem('recent_searchs', JSON.stringify(recent_searchs));
        }
    })

    $(document).on('click', '#search_results [youtube-id]', function () {
        var index = $(this).closest('li').index();
        var item = current_search_items[index];
        play_search(item);
    })

    $('#btn_recent_search_play').hover(function() {
        var html = '';
        for(var item of recent_search_plays) {
            html += `
            <a class="w3-bar-item w3-button" recent-search-play="${item.youtube_id}">
                <img src="${item.image}" /> 
                ${item.title}
                <span close-recent-search-play class="w3-right">X</span>
            </a>`;
        }
        $('#recent_search_plays').html(html);
    })
    $(document).on('click', '[recent-search-play]', function (event) {
        var index = $(this).index();
        var item = recent_search_plays[index];
        play_search(item);
    })

    $('#btn_recent_search').hover(function() {
        var html = '';
        for(var item of recent_searchs) {
            html += `
            <a class="w3-bar-item w3-button" recent-search="${item.term}">
                ${item.term}, ${item.order}
                <span close-recent-search class="w3-right">X</span>
            </a>`;
        }
        $('#recent_searchs').html(html);
    })
    $(document).on('click', '[recent-search]', function (event) {
        s_videos_times[player2.getVideoData().video_id] = player2.getCurrentTime();
        var index = $(this).index();
        var item = recent_searchs[index];
        $('#txt_search').val(item.term);
        $('#sel_order').val(item.order);
        $('#btn_search').click();
    })

    $(document).on('click', '[close-recent-search-play]', function(event) {
        var index = $(this).closest('[recent-search-play]').index();
        recent_search_plays.splice(index, 1); // 2nd parameter means remove one item only
        localStorage.setItem('recent_search_plays', JSON.stringify(recent_search_plays));
        $(this).closest('[recent-search-play]').remove();
    })

    $(document).on('click', '[close-recent-search]', function(event) {
        var index = $(this).closest('[recent-search]').index();
        var item = recent_searchs[index];
        var url = get_url(item.term, item.order);
        delete cached_calls[url];
        localStorage.setItem('cached_calls', JSON.stringify(cached_calls));

        recent_searchs.splice(index, 1); // 2nd parameter means remove one item only
        localStorage.setItem('recent_searchs', JSON.stringify(recent_searchs));
        $(this).closest('[recent-search]').remove();
    })



    $(document).on('click', '[add-search-item]', function (event) {
        event.stopPropagation();
        var index = $(this).closest('li').index();
        var item = current_search_items[index];
        add_youtube(item.youtube_id);
    })

    $('#txt_search').keyup(async function (e) {
        if (e.which == 13) {
            $('#btn_search').click();
        } else {
            var html_options = [];
            var term = $('#txt_search').val();
            var suggests = await auto_suggest(term);
            for (suggest of suggests) {
                html_options.push(`<option>${suggest}</option>`);
            }
            $('#suggestions').html(html_options.join(''));
        }
    });
})
function play_search(item) {
    s_videos_times[player2.getVideoData().video_id] = player2.getCurrentTime();
    $('#search_title').text(item.title);
    $('#search_description').text(item.description);
    $('#search_image').attr('src', item.image);

    if (is_arabic(item.title)) {
        $('#search_details').addClass('rtl');
    } else {
        $('#search_details').removeClass('rtl');
    }
    $('#search_results [youtube-id]').removeClass('w3-red');
    $(`#search_results [youtube-id="${item.youtube_id}"]`).addClass('w3-red');
    player2.loadVideoById(item.youtube_id, s_videos_times[item.youtube_id] || 0);

    //add to recent plays
    var item2 = recent_search_plays.find(obj => {
        return obj.youtube_id == item.youtube_id
    });
    if(!item2) {
        recent_search_plays.push({youtube_id: item.youtube_id, image: item.image, title: item.title, description: item.description});
        localStorage.setItem('recent_search_plays', JSON.stringify(recent_search_plays));
    }
}

var recent_search_plays = JSON.parse(localStorage.getItem('recent_search_plays') || '[]');
var recent_searchs = JSON.parse(localStorage.getItem('recent_searchs') || '[]');

function find_item(youtube_id) {
    for(var i in cached_calls) {
        for(var item of cached_calls[i].items) {
            if(youtube_id == item.id || youtube_id == item.id.videoId) {
                return {youtube_id : youtube_id, description : item.snippet.description, image: item.snippet.thumbnails.default.url, date: item.snippet.publishTime}
            }
        }
    }
}

function feed_item(item) {
    if(!item.date) {
        var _item = find_item(item.youtube_id);
        if(_item) {
            item.image = _item.image;
            item.description = _item.description;
            item.date = _item.date;
        } else {
            item.image = `http://img.youtube.com/vi/${item.youtube_id}/1.jpg`;
            item.description = '';
        }
    }
}


function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);
  
    var interval = seconds / 31536000;
  
    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }