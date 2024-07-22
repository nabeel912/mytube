var current_category;
var current_item;


function monitor_video_time() {
    setTimeout(() => {
        if (current_item && current_item.youtube_id) {
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


    localStorage.setItem("selected_category", current_category.id);
    localStorage.setItem("selected_item", current_item.youtube_id);

    var mem_str = JSON.stringify(mem);
    localStorage.setItem("mem", mem_str);
}

function youtube_is_ready() {
    var youtube_id = localStorage.getItem("selected_item");
    var item = current_category.list.find(obj => {
        return obj.youtube_id == youtube_id
    });
    if (item) {
        $(`#video_list [youtube-id="${item.youtube_id}"]`).click();
    } else {
        $(`#video_list [youtube-id]`).first().click();
    }
    monitor_video_time();
}



function render_categories() {
    var html_categories = "";
    for (var category of categories) {
        html_categories += get_html_category(category);
    }
    $('#bar_categories').append(html_categories);
    setTimeout(() => {
        var category_id = localStorage.getItem("selected_category");
        var category = categories.find(obj => {
            return obj.id == category_id
        });
        if (category) {
            $(`#bar_categories [category-id="${category.id}"]`).click();
        } else {
            $('#bar_categories [category-id]').first().click();
        }
    }, 0);
}
function render_list(category) {
    var html_list = "";
    for (var item of category.list) {
        html_list += get_html_youtube_item(item);
    }
    $('#video_list').html(html_list);
}
function get_html_category(category) {
    var html_category = `<button type="button" class="w3-bar-item w3-button" category-id="${category.id}"><span title>${category.title}</span> <span style="padding-left: 10px" class="w3-text-black remove-category" action="remove_category">×</span></button>`;
    return html_category;
}

function get_html_youtube_item(item) {
    var template = $('#li_template').html();
    template = template.replace("{youtube_id}", item.youtube_id);
    template = template.replace("{youtube_id}", item.youtube_id);
    template = template.replace("{title}", item.title);
    if (is_arabic(item.title)) {
        template = template.replace("{class}", "rtl");
    } else {
        template = template.replace("{class}", "");
    }
    return template;
}

//events
$(function () {
    render_categories();
    $(document).on('click', 'button[category-id]', function () {
        var category_id = $(this).attr('category-id');
        var category = categories.find(obj => {
            return obj.id == category_id
        });
        current_category = category;
        $('button[category-id]').removeClass('w3-red');
        $(this).addClass('w3-red');
        render_list(current_category);
        save_mem();
    });
    $(document).on('dblclick', 'button[category-id]', function () {
        var category_id = $(this).attr('category-id');
        var category = categories.find(obj => {
            return obj.id == category_id
        });
        var text = prompt("Enter a new name for the category: " + category.title, category.title);
        if (text) {
            $(this).find('[title]').text(text);
            category.title = text;
        }
        save_mem();
    });
    $(document).on('click', 'li[youtube-id]', function () {
        var youtube_id = $(this).attr('youtube-id');
        var item = current_category.list.find(obj => {
            return obj.youtube_id === youtube_id;
        });
        current_item = item;
        $('li[youtube-id]').removeClass('w3-red');
        $(this).addClass('w3-red');
        $('#txt_video_title').text(item.title);
        if (is_arabic(item.title)) {
            $('#txt_video_title').addClass('rtl');
        } else {
            $('#txt_video_title').removeClass('rtl');
        }
        var time = parseFloat(videos_times[item.youtube_id] || 0);
        playYoutube(current_item.youtube_id, time);
        save_mem();
    })
    $('[action="add_category"]').click(function () {
        var category_title = prompt("Please enter category title", "");
        if (category_title) {
            var id = get_new_id();
            var category = { id: id, title: category_title, list: [] };
            categories.push(category);
            var html_category = get_html_category(category);
            $('#bar_categories').append(html_category);
            save_mem();
        }
    })
    $('[action="add_item"]').click(function () {
        navigator.clipboard.readText()
            .then(text => {
                var user_input = '';
                if (text.toLowerCase().indexOf('http') === 0) {
                    user_input = text;
                }
                var text = prompt("Please enter youtube url or youtube id", user_input);
                if (text && text.length > 15) {
                    var youtube_id = getYoutubeId(text);
                    add_youtube(youtube_id);
                } else if (text) {
                    var youtube_id = text;
                    add_youtube(youtube_id);
                }
            })
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
    $(document).on('click', '[action="remove_category"]', function () {
        var category_id = $(this).closest('[category-id]').attr('category-id');
        var category = categories.find(obj => {
            return obj.id == category_id;
        });
        if (confirm("Are you sure to remove: " + category.title) == true) {
            const index = categories.indexOf(category);
            categories.splice(index, 1); // 2nd parameter means remove one item only
            $(this).closest('[category-id]').remove();
            save_mem();
        }
    })

    //actions
    $(document).on('click', '[action="save"]', function () {
        var cont = {categories: categories, videos_times: videos_times};
        var text = JSON.stringify(cont, null, "\t");
        download('912tube_' + get_new_id() + '.json', text)
    })
    $(document).on('click', '[action="about"]', function () {
        $('#modal_about').show();
    })
    $(document).on('click', '[action="load"]', function () {
        $('#modal_load').show();
    })
})



function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function add_youtube(youtube_id) {
    //check if already exists
    var item = current_category.list.find(obj => {
        return obj.youtube_id == youtube_id
    });
    if (item) {
        alert('It is already added...');
    } else {
        player2.cueVideoById(youtube_id, 0);
        setTimeout(() => {
            var title = player2.getVideoData().title;
            var item = { youtube_id: youtube_id, title: title };
            current_category.list.push(item);
            $('#video_list').append(get_html_youtube_item(item));
            save_mem();
        }, 1000);
    }
}

function is_arabic(title) {
    return title.indexOf('ا') !== -1;
}


// JavaScript to clear the content 
// of the div on Ctrl+C or Ctrl+V
document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && (event.key === 'v' || event.key === 'V')) {
        navigator.clipboard.readText()
            .then(text => {
                var youtube_id = getYoutubeId(text);
                if (youtube_id) {
                    add_youtube(youtube_id);
                }
            })
    }
});


function get_new_id() {
    const d = new Date();
    let ms = d.valueOf();
    return ms;
}