var ls_youtube_id;
s_videos_times = {};
function search_youtube(term, order) {
    return new Promise((resolve) => {
        var cached_calls = localStorage.getItem('cached_calls') || '{}';
        cached_calls = JSON.parse(cached_calls);

        var search_terms = localStorage.getItem('search_terms') || '[]';
        search_terms = JSON.parse(search_terms);

        var url;
        url = `https://www.googleapis.com/youtube/v3/search?part=snippet&key={key}&maxResults=50&q={search}&type=video`
        //url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&key={key}&maxResults=50&q={search}&type=video&chart=mostPopular&regionCode=SA`;
        if(order) {
            url += `&order=${order}`;
        }
        url = url.replace("{search}", term);

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
                    if(search_terms.indexOf(term) === -1) {
                        search_terms.push(term);
                        localStorage.setItem('search_terms', JSON.stringify(search_terms));
                    }
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
        var html_options = [];

        var search_terms = localStorage.getItem('search_terms') || '[]';
        search_terms = JSON.parse(search_terms);
        for (term of search_terms) {
            html_options.push(`<option>${term}</option>`);
        }

        $('#suggestions').html(html_options.join(''));
        player.pauseVideo();
        $('#modal_search').show();
    })

    $('#btn_search').click(async function () {
        var search = $('#txt_search').val();
        var order = $('#sel_order').val();
        var result = await search_youtube(search, order);
        var items = result.items;
        var html_items = [];
        for (var item of items) {
            var youtube_id = item.id.videoId || item.id;
            if (youtube_id) {
                var title = item.snippet.title;
                var description = item.snippet.description;
                var image = item.snippet.thumbnails.default.url;
                current_search_items.push({youtube_id: youtube_id, title: title, image: image, description: description});

                var css_class = "ltr";
                if (is_arabic(title)) {
                    css_class = "rtl";
                }
                html_items.push(`
                    <li class="w3-bar">
                        <div class="w3-row ${css_class}" youtube-id="${youtube_id}">
                            <div class="w3-col" style="width: 130px">
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
            recent_searchs.push({term: search, order: order})
        }
    })

    $(document).on('click', '#search_results [youtube-id]', function () {
        if (ls_youtube_id) {
            s_videos_times[ls_youtube_id] = player2.getCurrentTime();
        }
        var youtube_id = $(this).attr('youtube-id');
        var image = $(this).find('img').attr('src');
        var description = $(this).find('[description]').text();
        var youtube_id = $(this).attr('youtube-id');
        ls_youtube_id = youtube_id;
        var title = $(this).find('[title]').text();
        $('#search_title').text(title);
        $('#search_description').text(description);
        $('#search_image').attr('src', image);

        if (is_arabic(title)) {
            $('#search_details').addClass('rtl');
        } else {
            $('#search_details').removeClass('rtl');
        }
        $('#search_results [youtube-id]').removeClass('w3-red');
        $(this).addClass('w3-red');
        player2.loadVideoById(youtube_id, s_videos_times[youtube_id] || 0);

        //add to recent plays
        var item = recent_search_plays.find(obj => {
            return obj.youtube_id == youtube_id
        });
        if(!item) {
            recent_search_plays.push({youtube_id: youtube_id, image: image, title: title, description: description});
        }
    })

    $('#btn_recent_search_play').hover(function() {
        var html = '';
        for(var item of recent_search_plays) {
            html += `<a class="w3-bar-item w3-button" recent-search-play="${item.youtube_id}"><img src="${item.image}" /> ${item.title}</a>`;
        }
        $('#recent_search_plays').html(html);
    })
    $(document).on('click', '[recent-search-play]', function (event) {
        if (ls_youtube_id) {
            s_videos_times[ls_youtube_id] = player2.getCurrentTime();
        }
        var youtube_id = $(this).attr('recent-search-play');
        player2.loadVideoById(youtube_id, s_videos_times[youtube_id] || 0);
    })

    $('#btn_recent_search').hover(function() {
        var html = '';
        for(var item of recent_searchs) {
            html += `<a class="w3-bar-item w3-button" recent-search="${item.term}">${item.term}, ${item.order}</a>`;
        }
        $('#recent_searchs').html(html);
    })
    $(document).on('click', '[recent-search]', function (event) {
        if (ls_youtube_id) {
            s_videos_times[ls_youtube_id] = player2.getCurrentTime();
        }
        var index = $(this).index();
        var item = recent_searchs[index];
        $('#txt_search').val(item.term);
        $('#sel_order').val(item.order);
        $('#btn_search').click();
    })



    $(document).on('click', '[add-search-item]', function (event) {
        event.stopPropagation();
        var index = $(this).closest('li').index();
        var item = current_search_items[index];
        add_youtube(item.youtube_id);
    })

    $('#txt_search').keypress(async function (e) {
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

var recent_search_plays = [];
var recent_searchs = [];