setTimeout(() => {
    //fix();
    //fix2()
    //fix3();
    //save_mem();
}, 4000);


function fix() {
    for(var youtube_id in videos_times) {
        var category = categories.find(x=> x.list.find(y=> y.youtube_id == youtube_id));
        if(category) {
            var item = category.list.find(y=> y.youtube_id == youtube_id);
            item.video_time = videos_times[youtube_id];
            item.uts = get_timestamp();
        }
    }
}

function fix2() {
    for(var category of categories) {
        delete category.removed_items;
        category.uts = get_timestamp();
    }    
}

function fix3() {
    var id = 400;
    for(var category of categories) {
        for(item of category.list) {
            item.id = id++;
        }
    }
}