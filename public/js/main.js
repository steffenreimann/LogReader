var socket = io.connect('localhost:3000');
console.log(' loaded');
var lineTemp
var doScroll = true
socket.on('getFile', (data) => {
    console.log(data);
    lineTemp = data
});



socket.on('data', (data) => {
    console.log(data);
});

socket.on('file', (data) => {
    console.log(data);
});

socket.on('newLine', (data) => {

    addLine('lines', data)
    if (doScroll) {
        scrolldown('lines')
    }
});


function changeAutoScroll(params) {

    doScroll = !doScroll
    if (doScroll) {
        scrolldown()
    }
}

function scrolldown() {
    //var elem = document.getElementById(element);
    // elem.scrollTop = elem.scrollHeight;

    window.scrollTo(0, document.body.scrollHeight);
}

function addLine(element, data) {

    //document.getElementById(element).innerHTML += ejs.render(temp, data);
    document.getElementById(element).innerHTML += `<div class="card mt-1"><div class="card-body"><p class="card-text">${data.data.raw}</p></div></div>`
}

function loadFile() {
    socket.emit('getFile', 'line.ejs', function (params) {

    });
}


function reloadFilter(settings, types, FilterHTML, TypesHTML, PathsHTML) {
    var FilterElem = document.getElementById('outFilter');
    var TypesElem = document.getElementById('outTypes');
    var FilesElem = document.getElementById('outFiles');
    FilterElem.innerHTML = ''
    TypesElem.innerHTML = ''
    FilesElem.innerHTML = ''

    console.log(FilterHTML)
    console.log(TypesHTML)
    console.log(PathsHTML)
    console.log(socket.id)

    settings.filter.forEach(element => {
        FilterElem.innerHTML += ejs.render(FilterHTML, { data: element });
    });

    types.forEach(element => {

        TypesElem.innerHTML += ejs.render(TypesHTML, { data: element });
    });

    settings.paths.forEach(element => {
        var check = ""
        if (isShowing(element.sendIDs)) {
            var check = "checked"
        }
        FilesElem.innerHTML += ejs.render(PathsHTML, { data: element, checked: check });
    });
}


function isShowing(array) {
    found = array.indexOf(socket.id)
    if (found != -1) {
        console.log('found ID')

        return true
    } else {
        console.log('dont found id')
        return false
    }
}

function getHTML(elementID) {
    return document.getElementById(elementID).innerHTML
}


function getSettings() {
    socket.emit('getSettings', function (settings, types, FilterHTML, TypesHTML, PathsHTML) {
        reloadFilter(settings, types, FilterHTML, TypesHTML, PathsHTML)
    });
}


function removeFilter(filter) {
    socket.emit('removeFilter', filter, function (sucsses) {
        console.log(sucsses)
        getSettings()
    });
}

function addFilter(SearchString) {

    socket.emit('addFilter', SearchString, function (filter, filterStrings) {
        console.log('filter addend? ', filter)
        console.log('filter ', filterStrings)
        getSettings()
    });
}

function addFile() {
    addLogFile(document.getElementById('filePath').value)
}

function addLogFile(paths) {
    socket.emit('addLogFile', paths, function (oparation, files) {
        console.log('LogFile addend? ', oparation)
        console.log('files: ', files)
        getSettings()
    });
}
function removeLogFile(paths) {
    socket.emit('removeLogFile', paths, function (oparation, files) {
        console.log('LogFile removed? ', oparation)
        console.log('files: ', files)
        getSettings()
    });
}


function changeShow(elementID) {

    //console.log(elementID)

    var show = document.getElementById(elementID).checked
    console.log(show)
    socket.emit('changeShow', elementID, show, function (oparation) {
        // console.log('LogFile changeShow? ', oparation)
        getSettings()
    });
}

function loadCfg(callback) {
    socket.emit('getConfig', function (config) {
        console.log(config)
        callback(config)
    });
}

function CopyPath() {
    loadCfg(function (config) {
        copyToClipboard(config.path)
    })

}



function search() {
    var SearchString = searchInput.value
    console.log(SearchString)
    addFilter(SearchString)
    //window.find(SearchString)
}

var searchInput = document.getElementById('search')
var searchBTN = document.getElementById('searchBTN')
searchBTN.addEventListener("click", search, false);


const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};



getSettings()



