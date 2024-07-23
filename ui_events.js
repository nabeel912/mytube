var current_category;
var current_item;
var categories = [];
var videos_times = {};
var videos_times_str = localStorage.getItem("videos_times");
if (videos_times_str) {
    videos_times = JSON.parse(localStorage.getItem("videos_times"));
}


var categories_str = localStorage.getItem("categories");
if (categories_str) {
    categories = JSON.parse(categories_str);
} else {
    categories = [
        {
            id: 1, title: 'general', list: [
                { youtube_id: 'M7lc1UVf-VE', title: 'YouTube Developers Live: Embedded Web Player Customization' },
                { youtube_id: 'QPTwsoa47do', title: 'كيف تحصل على وظيفة وتتطوّر مهنيًا | بودكاست فنجان' },
                { youtube_id: '4aa61-zDiSo', title: 'الازدهار المالي: كيف يدير الأثرياء أموالهم ويضاعفون ثرواتهم بسرعة أكبر من 99٪ من الناس في العالم' },
                { youtube_id: 'bclSDhAXQaw', title: 'Couch Co-op is Alive and Well: These Games Prove It!' },
                { youtube_id: '1ATLKEKYAHw', title: '80 New Couch Co-op Games From 2023 You Need To Know!' },
                { youtube_id: 'om7jdf4RI74', title: '25 Free Co-Op Games for Friends (That Are Worth Playing)' },
            ],
        }, {
            id: 2, title: 'gaming', list: [
                { youtube_id: 'UwH9lX4efdc', title: 'I Uncovered Minecraft\'s Oldest Mystery (Giant Alex)' }
            ]
        }
    ]
}

function monitor_video_time() {
    setTimeout(() => {
        if (current_item && current_item.youtube_id) {
            var duration = getVideoDuration();
            var seek_time = getSeekTime();
            if (Math.ceil(videos_times[current_item.youtube_id]) == Math.ceil(getVideoDuration())) {
                $('#status').text('Done');
                player.cueVideoById(current_item.youtube_id);
                videos_times[current_item.youtube_id] = 0;
            } else {
                $('#status').text('playing');
                videos_times[current_item.youtube_id] = seek_time;
                if (!current_item.duration) { //for backward compatibility
                    current_item.duration = duration;
                    save_mem();
                }
                save_videos_times();
            }
            var percentage = parseFloat(0);

            if (videos_times[current_item.youtube_id] & duration) {
                percentage = videos_times[current_item.youtube_id] / duration * 100.0;
            }
            $(`li[youtube-id="${current_item.youtube_id}"] [percentage-bar]`).css('width', percentage + "%")
        }
        monitor_video_time();
        removeAds();
    }, 1000);
}
function save_mem() {
    var categories_str = JSON.stringify(categories);
    localStorage.setItem("categories", categories_str);

    if(current_category) {
        localStorage.setItem("selected_category", current_category.id);
    }
    if(current_item) {
        localStorage.setItem("selected_item", current_item.youtube_id);
    }

}
function save_videos_times() {
    var videos_times_str = JSON.stringify(videos_times);
    localStorage.setItem("videos_times", videos_times_str);
}


function youtube_is_ready() {
    if(current_category) {
        var youtube_id = localStorage.getItem("selected_item");
        var item = current_category.list.find(obj => {
            return obj.youtube_id == youtube_id
        });
        if (item) {
            $(`#video_list [youtube-id="${item.youtube_id}"]`).click();
        } else {
            $(`#video_list [youtube-id]`).first().click();
        }
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
    setTimeout(() => {
        if(current_item) {
            $(`li[youtube-id="${current_item.youtube_id}"]`).addClass('w3-red');
        }
    }, 0);
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
    var percentage = 0;
    if(videos_times[item.youtube_id] & item.duration) {
        percentage = videos_times[item.youtube_id] / item.duration * 100.0;
    }
    
    template = template.replace("{percentage}", percentage);
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
            $(`button[category-id="${id}"]`).click();
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
    $(document).on('click', '[action="remove_list_item"]', function (event) {
        event.stopPropagation();
        var youtube_id = $(this).closest('[youtube-id]').attr('youtube-id');
        var item = current_category.list.find(obj => {
            return obj.youtube_id === youtube_id;
        });
        const index = current_category.list.indexOf(item);
        current_category.list.splice(index, 1); // 2nd parameter means remove one item only
        $(this).closest('[youtube-id]').remove();
        save_mem();
    })
    $(document).on('click', '[action="remove_category"]', function (event) {
        event.stopPropagation();
        var category_id = $(this).closest('[category-id]').attr('category-id');
        var category = categories.find(obj => {
            return obj.id == category_id;
        });
        if (confirm("Are you sure to remove: " + category.title) == true) {
            const index = categories.indexOf(category);
            categories.splice(index, 1); // 2nd parameter means remove one item only
            $(this).closest('[category-id]').remove();
            if(current_category.id == category_id) {
                if($('button[category-id]').length) {//if there are categories, go to the first
                    $('button[category-id]').first().click();
                } else {//otherwise remove youtube list
                    $('#video_list').html('');
                }
            }
            save_mem();
        }
    })

    //actions
    $(document).on('click', '[action="save"]', function () {
        var cont = {categories: categories, videos_times: videos_times, selected_category: current_category.id, selected_item : current_item.youtube_id};
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
            var author = player2.getVideoData().author;
            var duration = player2.getDuration();
            var item = { youtube_id: youtube_id, title: title, duration: duration, author: author };
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






//load file
$(document).on('click', '[action="load_file"]', function () {
    let fr = new FileReader();
    fr.onload = function () {
        var mem = JSON.parse(fr.result);
        localStorage.setItem('categories', JSON.stringify(mem.categories));
        localStorage.setItem('categvideos_timesories', JSON.stringify(mem.videos_times));
        localStorage.setItem('current_category', JSON.stringify(mem.selected_category));
        localStorage.setItem('current_item', JSON.stringify(mem.selected_item));
        location.reload();
    }
    var file = document.getElementById('file').files[0];
    fr.readAsText(file);
})

function removeAds() {
    if($('body').attr('style')) {
        $('body').removeAttr('style');
        $('body>div').first().remove();
    }
}