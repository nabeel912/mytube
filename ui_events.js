var current_category;
var current_item;


function monitor_video_time() {
    setTimeout(() => {
        if(current_item && current_item.youtube_id) {
            var seek_time = getSeekTime();
            videos_times[current_item.youtube_id] = seek_time;
            save_mem();
        }
        monitor_video_time();
    }, 1000);
}
function save_mem() {
    var categories_str = JSON.stringify(categories);
    localStorage.setItem("categories", categories_str);

    var videos_times_str = JSON.stringify(videos_times);
    localStorage.setItem("videos_times", videos_times_str);

    var mem_str = JSON.stringify(mem);
    localStorage.setItem("mem", mem_str);
}



function render_categories() {
    var html_categories = "";
    for (var category of categories) {
        html_categories += get_html_category(category);
    }
    $('#bar_categories').append(html_categories);
    current_category = categories[0];
    render_list(current_category);
}
function render_list(category) {
    var html_list = "";
    for (var item of category.list) {
        html_list += get_html_youtube_item(item);
    }
    $('#video_list').html(html_list);
}
function get_html_category(category) {
    var html_category = `<button type="button" class="w3-bar-item w3-button" category="${category.title}">${category.title}</button>`;
    return html_category;
}

function get_html_youtube_item(item) {
    var template = $('#li_template').html();
    template = template.replace("{youtube_id}", item.youtube_id);
    template = template.replace("{youtube_id}", item.youtube_id);
    template = template.replace("{title}", item.title);
    if(is_arabic(item.title)) {
        template = template.replace("{class}", "rtl");
    } else {
        template = template.replace("{class}", "");
    }
    return template;
}








//events
$(function () {
    render_categories();
    $(document).on('click', 'button[category]', function () {
        var category_title = $(this).attr('category');
        var category = categories.find(obj => {
            return obj.title === category_title
        });
        current_category = category;
        $('button[category]').removeClass('w3-red');
        $(this).addClass('w3-red');
        render_list(current_category);
    })
    $(document).on('click', 'li[youtube-id]', function () {
        var youtube_id = $(this).attr('youtube-id');
        var item = current_category.list.find(obj => {
            return obj.youtube_id === youtube_id;
        });
        current_item = item;
        $('li[youtube-id]').removeClass('w3-red');
        $(this).addClass('w3-red');
        $('#txt_video_title').text(item.title);
        if(is_arabic(item.title)) {
            $('#txt_video_title').addClass('rtl');
        } else {
            $('#txt_video_title').removeClass('rtl');
        }
        var time = parseFloat(videos_times[item.youtube_id] || 0);
        playYoutube(current_item.youtube_id, time);
    })
    $('[action="add_category"]').click(function() {
        var category_title = prompt("Please enter category title", "");
        if(category_title) {
            var category = {title: category_title, list : []};
            categories.push(category);
            var html_category = get_html_category(category);
            $('#bar_categories').append(html_category);
            save_mem();
        }
    })
    $('[action="add_item"]').click(function() {
        var youtube_id = prompt("Please enter youtube id", "");
        if(youtube_id) {
            player2.cueVideoById(youtube_id, 0);

            setTimeout(() => {
                var title = player2.getVideoData().title;
                var item = { youtube_id: youtube_id, title: title };
                current_category.list.push(item);
                $('#video_list').append(get_html_youtube_item(item));
                save_mem();
            }, 1000);
        }
    })
    $(document).on('click', '[action="remove_list_item"]', function () {
        var youtube_id = $(this).closest('[youtube-id]').attr('youtube-id');
        var item = current_category.list.find(obj => {
            return obj.youtube_id === youtube_id;
        });
        const index = current_category.list.indexOf(item);
        current_category.list.splice(index, 1); // 2nd parameter means remove one item only
        $(this).closest('[youtube-id]').remove();
        save_mem();
    })
})


function is_arabic(title) {
    return title.indexOf('ا') !== -1;
}