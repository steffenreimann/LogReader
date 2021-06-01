
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
    console.log(data)
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
    document.getElementById(element).innerHTML += `<div class="card mt-1"><div class="card-body"><p class="card-text">${data}</p></div></div>`
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

//var searchInput = document.getElementById('search')
//var searchBTN = document.getElementById('searchBTN')
//searchBTN.addEventListener("click", search, false);




//var clearbtn = document.getElementById('startGameBTN')
//clearbtn.addEventListener("click", startGame, false);
//
//var installSelector = document.getElementById('changeInstall')
//clearbtn.addEventListener("click", startGame, false);



var usedInstallPath = ''


function changeInstall(element) {
    const bsCollapse = new mdb.Collapse(document.getElementById('collapseCustomInstall'), {
        toggle: false,
    })

    if (element.value == 'custom') {
        console.log('Want to use custom path')
        bsCollapse.show()
    } else {
        console.log('Want to use ', element.value)
        bsCollapse.hide()
        usedInstallPath = element.value
    }
}



const copyToClipboard = str => {
    const el = document.createElement('textarea');
    el.value = str;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
};

function clear() {
    console.log('Clear Log')
    document.getElementById('lines').innerHTML = ''
}


function getHTMLView(file, cb) {
    socket.emit('getHTMLView', file, function (filedata) {
        cb(filedata)
    });
}


function startGame(params) {


    // var attr = ["-EpicPortal", "-NoSteamClient", "-NoMultiplayer", "-Username=herbbertus"]
    var attr = []

    var i = 0

    currentAttr.forEach(element => {
        i++
        attr.push(element.value)
        console.log('attr.length == i', attr.length == i);
        if (currentAttr.length == i) {
            console.log('Open New Window');
            var startData = { filePath: currentFile.filePaths[0], ext: currentFile.ext, attr: attr }
            socket.emit('newWindow', startData, function (oparation) {
                console.log('LogFile changeShow? ', oparation)

            });
        }

    });
}




var currentFile = { filePaths: ['G:/Software/Games/EpicGames/SatisfactoryEarlyAccess/FactoryGame.exe'], ext: '.exe' }
var currentAttr = []


function openDialog(params) {
    socket.emit('openDialog', function (result) {
        console.log('openDialog ', result)

        if (!result.canceled) {
            usedInstallPath = result
            document.getElementById('filePath').value = usedInstallPath
        }
        if (result.ext == '.exe') {

        }

    });
}


function addAttr(params) {
    console.log(typeof params);
    if (typeof params != 'undefined') {
        if (typeof params == 'object') {
            getHTMLView('attrItem', (htmldata) => {
                params.forEach(element => {
                    var data = { value: element, id: UUID() }
                    currentAttr.push(data)
                    document.getElementById('attr').innerHTML += ejs.render(htmldata, { data: data });

                });
            })
        } else {

            var data = { value: params, id: UUID() }
            currentAttr.push(data)
            console.log(data)
            getHTMLView('attrItem', (htmldata) => {
                document.getElementById('attr').innerHTML += ejs.render(htmldata, { data: data });
            })
        }
    } else if (document.getElementById('attrInput').value != '') {
        console.log(typeof document.getElementById('attrInput').value);
        var data = { value: document.getElementById('attrInput').value, id: UUID() }
        currentAttr.push(data)
        console.log(data)
        getHTMLView('attrItem', (htmldata) => {
            document.getElementById('attr').innerHTML += ejs.render(htmldata, { data: data });
        })
    }
}

function changeAttr(id) {

    //var data = { value: document.getElementById('attrInput-' + id).value, id: id }

    var i = 0
    currentAttr.forEach(element => {
        if (element.id == id) {
            currentAttr[i].value = document.getElementById('attrInput-' + id).value
            renderAttr()
        }
        i++
    });
}


function renderAttr() {
    document.getElementById('attr').innerHTML = ''
    getHTMLView('attrItem', (htmldata) => {
        currentAttr.forEach(element => {
            document.getElementById('attr').innerHTML += ejs.render(htmldata, { data: element });
        });
    })
}

function removeAttr(id) {
    var i = 0
    currentAttr.forEach(element => {
        if (element.id == id) {
            currentAttr.splice(i, 1)
            renderAttr()
        }
        i++
    });
}

function clearAttr(params) {
    currentAttr.clear()
    document.getElementById('attr').innerHTML = ``
}




function UUID() {
    function ff(s) {
        var pt = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + pt.substr(0, 4) + "-" + pt.substr(4, 4) : pt;
    }
    return ff() + ff(true) + ff(true) + ff();
}



document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    var out = []
    Object.keys(event.dataTransfer.files).forEach(function (key) {
        console.log('Key : ', key, ', Value : ', event.dataTransfer.files[key])

        out.push(event.dataTransfer.files[key].path)
    })
    console.log('addWatchedFiles: ', out)
    window.addWatchedFiles(out)
    //const copy = JSON.parse(JSON.stringify(event.dataTransfer.files));
    //console.log('File Path of dragged files: ', event.dataTransfer.files)
    //console.log('typeof: ', typeof event.dataTransfer.files)


});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('dragenter', (event) => {
    console.log('File is in the Drop Space');
});

document.addEventListener('dragleave', (event) => {
    console.log('File has left the Drop Space');
});

async function copyObj(data) {
    var files = []
    for (const f of event.dataTransfer.files) {
        // Using the path attribute to get absolute file path
        //console.log('File Path of dragged files: ', f.path)
        files.push(f.path)
    }


}





addAttr(['-EpicPortal', '-NoSteamClient', '-NoMultiplayer', '-Username=herbbert', '-ResX=1000', '-ResY=1000', '-WINDOWED'])
