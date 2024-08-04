var ls_youtube_id;
s_videos_times = {};
function search_youtube(term) {
    return new Promise((resolve) => {
        var old_searches = localStorage.getItem('old_searches') || '{}';
        old_searches = JSON.parse(old_searches);
        if (old_searches[term]) {
            resolve(old_searches[term]);
        } else {
            var url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q={search}&key=AIzaSyCI2wJIGo7p1gMx8rZGFlraoPpKHsKKYPU&maxResults=50`
            url = url.replace("{search}", term);
            $.ajax({
                url: url,
                dataType: "jsonp",
                success: function (data) {
                    old_searches[term] = data;
                    localStorage.setItem('old_searches', JSON.stringify(old_searches));
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

$(function () {
    document.getElementById("txt_search").addEventListener("input", function (event) {
        if (event.inputType == "insertReplacementText" || event.inputType == null) {
            $('#txt_search').val(event.target.value);
            $('#btn_search').click();
        }
    })

    $('[action="search"]').click(function () {
        var html_options = [];

        var old_searches = localStorage.getItem('old_searches') || '{}';
        old_searches = JSON.parse(old_searches);
        for (term in old_searches) {
            html_options.push(`<option>${term}</option>`);
        }

        $('#suggestions').html(html_options.join(''));
        player.pauseVideo();
        $('#modal_search').show();
    })

    $('#btn_search').click(async function () {
        var search = $('#txt_search').val();
        var result = await search_youtube(search);
        var items = result.items;
        var html_items = [];
        for (var item of items) {
            var title = item.snippet.title;
            var description = item.snippet.description;
            var img = item.snippet.thumbnails.default.url;
            var video_id = item.id.videoId;
            var css_class = "ltr";
            if (is_arabic(title)) {
                css_class = "rtl";
            }
            if (video_id) {
                html_items.push(`
                    <li class="w3-bar">
                        <div class="w3-row ${css_class}" youtube-id="${video_id}">
                            <div class="w3-col" style="width: 130px">
                                <img src="${img}" />
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
    })

    $(document).on('click', '[add-search-item]', function (event) {
        event.stopPropagation();
        var youtube_id = $(this).closest('[youtube-id]').attr('youtube-id');
        add_youtube(youtube_id);
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

