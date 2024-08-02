var last_clipboard;
var current_category;
var current_item;
var categories = [];

var categories_str = localStorage.getItem("categories");
if (categories_str) {
    categories = JSON.parse(categories_str);
} else {
    categories = [
        {
            id: 1, title: 'general', list: [
                { id: 3, youtube_id: 'M7lc1UVf-VE', title: 'YouTube Developers Live: Embedded Web Player Customization' },
                { id: 4, youtube_id: 'QPTwsoa47do', title: 'كيف تحصل على وظيفة وتتطوّر مهنيًا | بودكاست فنجان' },
                { id: 5, youtube_id: '4aa61-zDiSo', title: 'الازدهار المالي: كيف يدير الأثرياء أموالهم ويضاعفون ثرواتهم بسرعة أكبر من 99٪ من الناس في العالم' },
                { id: 6, youtube_id: 'bclSDhAXQaw', title: 'Couch Co-op is Alive and Well: These Games Prove It!' },
                { id: 7, youtube_id: '1ATLKEKYAHw', title: '80 New Couch Co-op Games From 2023 You Need To Know!' },
                { id: 8, youtube_id: 'om7jdf4RI74', title: '25 Free Co-Op Games for Friends (That Are Worth Playing)' },
            ],
        }
    ]
}
current_category = categories.find(x=> x.list.find(y=> y.id == localStorage.getItem('selected_item'))) || {list : []};
if(current_category) {
    current_item = current_category.list.find(x=> x.id == localStorage.getItem('selected_item'));
}

function monitor_video_time() {
    setTimeout(() => {
        if (current_item && current_item.youtube_id && player.getVideoData() && player.getVideoData().video_id == current_item.youtube_id) {
            var duration = getVideoDuration();
            var seek_time = getSeekTime();
            if (duration && Math.ceil(current_item.video_time) == Math.ceil(duration)) {//finished
                current_item.video_time = 0;
                player.cueVideoById(current_item.youtube_id);
            } else if(current_item.video_time != seek_time) {
                current_item.video_time = seek_time;
                current_item.uts = get_timestamp();
                if (!current_item.duration) { //for backward compatibility
                    current_item.duration = duration;
                }
                save_mem();
            }
            
            var percentage = 0;
            if (current_item.video_time && duration) {
                percentage = current_item.video_time / duration * 100.0;
                percentage = Math.ceil(percentage);
            }
            $(`li[youtube-item-id="${current_item.id}"] [percentage-bar]`).css('width', percentage + "%")
        }
        monitor_video_time();
        removeAds();
    }, 1000);
}




function save_mem() {
    var categories_str = JSON.stringify(categories);
    localStorage.setItem("categories", categories_str);

    if (current_item) {
        localStorage.setItem("selected_item", current_item.id);
    }

}

function youtube_is_ready() {
    if (current_category) {
        var youtube_item_id = localStorage.getItem("selected_item");
        var item = (current_category.list || []).find(obj => {
            return obj.id == youtube_item_id
        });

        if(!item && current_category.list && current_category.list.length) {
            item = current_category.list[0];
        }        

        if(item) {
            select_youtube_item(item.id, false);
        }
    }
    monitor_video_time();
}



async function render_categories() {
    var html_categories = "";
    categories = categories.filter(x=> x.removed !== 1);
    for (var category of categories) {
        html_categories += get_html_category(category);
    }
    $('#bar_categories').append(html_categories);
    var category_id = current_category.id;
    var category = categories.find(obj => {
        return obj.id == category_id
    });

    //wait till it renders
    setTimeout(() => {
        if (category) {
            $(`#bar_categories [category-id="${category.id}"]`).click();
        } else {
            $('#bar_categories [category-id]').first().click();
        }
    }, 0);
}
function render_list(category) {
    var html_list = "";
    var list = (category.list || []).filter(x=> x.removed !== 1);
    for (var item of list) {
        html_list += get_html_youtube_item(item);
    }
    $('#video_list').html(html_list);

    //wait till it renders
    setTimeout(() => {
        if (current_item) {
            $(`li[youtube-item-id="${current_item.id}"]`).addClass('w3-red');
        }
    }, 0);
}
function get_html_category(category) {
    var image_url;
    if (category && category.list && category.list.length) {
        image_url = `http://img.youtube.com/vi/${category.list[0].youtube_id}/1.jpg`;
    }
    var html_category = `
    <button type="button" class="w3-bar-item w3-button" category-id="${category.id}">
        <img src="${image_url}" /> 
        <span title>${category.title}</span> 
        <span style="padding-left: 10px" class="w3-text-black remove-category" action="remove_category">×</span>
    </button>`;
    return html_category;
}

function get_html_youtube_item(item) {
    var template = $('#li_template').html();
    template = template.replace("{youtube_item_id}", item.id);
    template = template.replace("{youtube_id}", item.youtube_id);
    template = template.replace("{title}", get_short_title(item.title));
    var percentage = 0;
    if (item.video_time & item.duration) {
        percentage = item.video_time / item.duration * 100.0;
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
        if(category) {
            current_category = category;
            $('button[category-id]').removeClass('w3-red');
            $(this).addClass('w3-red');
            render_list(current_category);
        }
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
            category.uts = get_timestamp();
        }
        save_mem();
    });
    $(document).on('click', 'li[youtube-item-id]', function () {
        var youtube_item_id = $(this).attr('youtube-item-id');
        select_youtube_item(youtube_item_id, true);
        save_mem();
    })
    $('[action="add_category"]').click(function () {
        var category_title = prompt("Please enter category title", "");
        if (category_title) {
            var id = get_new_id();
            var category = { id: id, title: category_title, list: [], uts: get_timestamp() };
            categories.push(category);
            var html_category = get_html_category(category);
            $('#bar_categories').append(html_category);
            save_mem();
            $(`button[category-id="${id}"]`).click();
        }
    })

    $('[action="add_item"]').click(async function () {
        var text = await get_clipboard();
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

    $(document).on('click', '[action="remove_list_item"]', function (event) {
        event.stopPropagation();
        var youtube_item_id = $(this).closest('[youtube-item-id]').attr('youtube-item-id');
        var item = current_category.list.find(obj => {
            return obj.id == youtube_item_id;
        });
        item.removed = 1;
        item.uts = get_timestamp();
        $(this).closest('[youtube-item-id]').remove();      
        save_mem();
    })
    $(document).on('click', '[action="remove_category"]', function (event) {
        event.stopPropagation();
        var category_id = $(this).closest('[category-id]').attr('category-id');
        var category = categories.find(obj => {
            return obj.id == category_id;
        });
        if (confirm("Are you sure to remove: " + category.title) == true) {
            category.removed = 1;
            category.uts = get_timestamp();
            $(this).closest('[category-id]').remove();
            if (current_category.id == category_id) {
                if ($('button[category-id]').length) {//if there are categories, go to the first
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
        var cont = { categories: categories };
        var text = JSON.stringify(cont, null, "\t");
        download('912tube_' + get_new_id() + '.json', text)
    })
    $(document).on('click', '[action="about"]', function () {
        $('#modal_about').show();
    })
    $(document).on('click', '[action="load"]', function () {
        $('#modal_load').show();
    })

    //cloud
    $('[action="save_to_cloud"]').click(async function () {
        await ui_save_to_cloud();
    })
    $('[action="load_from_cloud"]').click(async function () {
        await ui_load_from_cloud();
        location.reload();
    })
    $('[action="sync_with_cloud"]').click(async function () {
        await ui_sync_with_cloud();
        location.reload();        
    })

    $('[action="sign_out"]').click(async function () {
        await ui_sync_with_cloud();
        localStorage.removeItem('categories');
        localStorage.removeItem('selected_item');
        localStorage.removeItem('last_local_sync');
       
        var no_user_profile = localStorage.getItem('no_user_profile');
        if(no_user_profile) {
            no_user_profile = JSON.parse(no_user_profile);
        } else {
            no_user_profile = { categories: [{id: 1, title: 'general', list: []}] };
        }
        localStorage.setItem('categories', JSON.stringify(no_user_profile.categories));
        localStorage.removeItem('no_user_profile');

        signOut();
        location.reload();
    })


    //drag drop
    var dropbox = document.getElementById('video_list');
    dropbox.addEventListener('dragenter', noopHandler, false);
    dropbox.addEventListener('dragexit', noopHandler, false);
    dropbox.addEventListener('dragover', noopHandler, false);
    dropbox.addEventListener('drop', drop, false);

    function noopHandler(evt) {
        evt.stopPropagation();
        evt.preventDefault();
    }
    function drop(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var url = evt.dataTransfer.getData('Text');
        var youtube_id = getYoutubeId(url);
        if (youtube_id) {
            add_youtube(youtube_id);
        }
    }
})

function select_youtube_item(youtube_item_id, start) {
    var item = current_category.list.find(obj => {
        return obj.id == youtube_item_id;
    });
    current_item = item;
    $('li[youtube-item-id]').removeClass('w3-red');
    $(`li[youtube-item-id="${youtube_item_id}"]`).addClass('w3-red');
    $('#txt_video_title').text(item.title);
    var picture = `http://img.youtube.com/vi/${item.youtube_id}/1.jpg`;
    $('#img_video_picture').attr('src', picture);
    $(`#bar_categories [category-id="${current_category.id}"] img`).attr('src', picture);
    if (is_arabic(item.title)) {
        $('#ctr_video_title').addClass('rtl');
    } else {
        $('#ctr_video_title').removeClass('rtl');
    }
    var time = parseFloat(item.video_time || 0);
    if(start) {
        playYoutube(current_item.youtube_id, time);
    } else {
        player.cueVideoById(current_item.youtube_id, time);
    }
}

async function ui_save_to_cloud() {
    var ts = get_timestamp();
    localStorage.setItem('last_local_sync', ts);
    var cont = { categories: categories, uts: ts };
    await save_to_cloud(getCookie('_id'), cont);
}

async function ui_load_from_cloud() {
    var data = await load_from_cloud(getCookie('_id'));
    localStorage.setItem('categories', JSON.stringify(data.categories));
    localStorage.setItem('last_local_sync', data.uts);
    location.reload();
}

async function ui_sign_in() {
    var no_user_profile = {categories : categories};
    localStorage.setItem('no_user_profile', JSON.stringify(no_user_profile));
    await ui_load_from_cloud();
    location.reload();
}

async function ui_sync_with_cloud() {
    last_local_sync = parseInt(localStorage.getItem('last_local_sync') || '0');
    var cloud_data = await load_from_cloud(getCookie('_id')) || { categories: [{id: 1, title: 'general', list: []}], uts : -1 };
    var sync_categories = JSON.parse(JSON.stringify(cloud_data.categories));
    for(var local_category of categories) {
        var sync_category = sync_categories.find(x=> x.id == local_category.id);
        if(sync_category) { //already exists in cloud
            //sync list
            const category_index = sync_categories.indexOf(sync_category);
            sync_categories[category_index].list = sync_categories[category_index].list|| [];
            var sync_list = sync_categories[category_index].list || [];
            for(var local_item of local_category.list || []) {
                var sync_item = sync_list.find(x=> x.id == local_item.id);
                if(sync_item) { //already exists in cloud
                    const item_index = sync_list.indexOf(sync_item);
                    if(local_item.removed === 1) { //remove it from cloud
                        sync_list.splice(item_index, 1); // 2nd parameter means remove one item only
                    } else if(local_item.uts > sync_item.uts) { //local is newer
                        sync_list[item_index] = local_item;
                    }
                } else if(local_item.removed !== 1 && local_item.uts > last_local_sync) { //not exists in cloud and not removed
                    sync_list.push(local_item);
                }
            }

            if(local_category.removed === 1) { //remove it from cloud
                sync_categories.splice(category_index, 1); // 2nd parameter means remove one item only
            } else if(local_category.uts > sync_category.uts) { //local is newer //update category
                var sync_list = sync_category.list;
                sync_categories[category_index] = local_category;
                sync_categories[category_index].list = sync_list;
            }

        } else {
            var new_items = (local_category.list || []).filter(x=> x.uts > last_local_sync && x.removed !== -1);
            if(local_category.removed !== 1 && local_category.uts > last_local_sync) { //not exists in cloud and not removed, then add
                local_category.list = (local_category.list || []).filter(x=> x.removed !== 1);
                sync_categories.push(local_category);
            } else if(new_items.length) { //added locally after deleting the category in cloud
                local_category.list = new_items;
                sync_categories.push(local_category);
            }
        } 
    }

    //save to cloud
    var ts = get_timestamp();
    localStorage.setItem('last_local_sync', ts);
    localStorage.setItem('categories', JSON.stringify(sync_categories));
    
    var cont = { categories: sync_categories, uts: ts };
    await save_to_cloud(getCookie('_id'), cont);
}


function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


async function add_youtube(youtube_id) {
    //check if already exists
    current_category.list = current_category.list || [];
    var item = current_category.list.find(obj => {
        return obj.youtube_id == youtube_id && obj.removed !== 1
    });
    if (item) {
        alert('It is already added...');
    } else {
        var info = await get_youtube_info(youtube_id);
        var _id = get_new_id();

        var item = { id: _id, youtube_id: info.youtube_id, title: info.title, duration: info.duration, video_time: 0, uts: get_timestamp() };
        current_category.list.push(item);
        $('#video_list').append(get_html_youtube_item(item));
        save_mem();
    }
}

function is_arabic(title) {
    return title.indexOf('ا') !== -1;
}


// JavaScript to clear the content 
// of the div on Ctrl+C or Ctrl+V
document.addEventListener('keydown', async function (event) {
    if (event.ctrlKey && (event.key === 'v' || event.key === 'V')) {
        await paste_clipboard();
    }
});

async function paste_clipboard() {
    if (document.hasFocus()) {
        var text = await get_clipboard();
        if (last_clipboard != text) {
            var youtube_id = getYoutubeId(text);
            if (youtube_id) {
                add_youtube(youtube_id);
            }
            last_clipboard = text;
        }
    }
}


function get_new_id() {
    const _id = get_timestamp();
    return _id;
}

function get_timestamp() {
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
        location.reload();
    }
    var file = document.getElementById('file').files[0];
    fr.readAsText(file);
})

function removeAds() {
    if ($('body').attr('style')) {
        $('body').removeAttr('style');
        $('body>div').first().remove();
    }
}

function get_short_title(title) {
    var max_length = 70;
    if ((title || '').length > max_length) {
        title = title.substring(0, max_length) + '...';
    }
    return title;
}

function get_clipboard() {
    return new Promise((resolve) => {
        navigator.clipboard.readText().then(text => {
            resolve(text);
        })
    })
}