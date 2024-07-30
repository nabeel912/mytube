/*
var url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q={search}&key=AIzaSyCI2wJIGo7p1gMx8rZGFlraoPpKHsKKYPU&maxResults=50`

url = url.replace("{serach}", 'cats');
$.ajax({
    url: url,
    dataType: "jsonp",
    success: function(data) {
        var a = 4;
    }
});
*/

function search_youtube(term) {
    return new Promise((resolve) => {
        var old_searches = localStorage.getItem('old_searches') || '{}';
        old_searches = JSON.parse(old_searches);
        if(old_searches[term]) {
            resolve(old_searches[term]);
        } else {
            var url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q={search}&key=AIzaSyCI2wJIGo7p1gMx8rZGFlraoPpKHsKKYPU&maxResults=50`
            url = url.replace("{search}", term);
            $.ajax({
                url: url,
                dataType: "jsonp",
                success: function(data) {
                    old_searches[term] = data;
                    localStorage.setItem('old_searches', JSON.stringify(old_searches));
                    resolve(data);
                }
            });
        }
    })
}

$(function() {



    document.getElementById("txt_search")
    .addEventListener("input", function(event){
          if(event.inputType == "insertReplacementText" || event.inputType == null) {
            $('#txt_search').val(event.target.value);
            $('#btn_search').click();
      }
  })







    $('[action="search"]').click(function () {
        var html_options = [];
        
        var old_searches = localStorage.getItem('old_searches') || '{}';
        old_searches = JSON.parse(old_searches);
        for(term in old_searches) {
            html_options.push(`<option>${term}</option>`);
        }

        $('#suggestions').html(html_options.join(''));
        $('#modal_search').show();
    })

    $('#btn_search').click(async function() {
        var search = $('#txt_search').val();
        var result = await search_youtube(search);
        var items = result.items;
        var html_items = [];
        for(var item of items) {
            var title = item.snippet.title;
            var description = item.snippet.description;
            var img = item.snippet.thumbnails.default.url;
            var video_id = item.id.videoId;
            html_items.push(`
                <div class="w3-row" youtube-id="${video_id}">
                    <div class="w3-col" style="width: 130px">
                        <img src="${img}" />
                    </div>
                    <div class="w3-rest">
                        <h4>${title}</h4>
                        ${description}
                    </div>
                </div>`);
        }
        $('#search_results').html(html_items.join(''));
    })

    $(document).on('click', '#search_results [youtube-id]', function() {
        var youtube_id = $(this).attr('youtube-id');
        add_youtube(youtube_id);
    })

    $('#txt_search').keypress(function (e) {
        if (e.which == 13) {
            $('#btn_search').click();
        }
      });
})