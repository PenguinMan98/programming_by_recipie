var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
// app.use(express.urlencoded()); // to support URL-encoded bodies

var rUtil = require('./util/rethink');

// initialize the templating engine
app.set('views', './views');
app.engine('handlebars', exphbs({defaultLayout: 'home'}));
app.set('view engine', 'handlebars');

// listen on this port
var server = app.listen(9876, function(){
    console.log('This is my example app running');
});
var io = require('socket.io').listen(server);

// serve static files
app.use(express.static('public'));


/*
* Index Page
* */
app.get('/', function(req, res){
    if(req.query.task && req.query.language && req.query.version){
        // todo: some validation on these params
        res.redirect(req.query.language + "/" + req.query.version + "/" + req.query.task )
        return;
    }

    var tasks = rUtil.getTasks(function( tasks ){
        tempTaskList = [];// the temps are used for de-duplicating
        tempLangList = [];
        tempVerList = [];
        taskList = [];
        langList = [];
        verList = [];
        for(var i = 0; i < tasks.length; i++){
            if(tempTaskList.indexOf(tasks[i].task) < 0){
                tempTaskList.push(tasks[i].task);
                taskList.push({task:tasks[i].task});
            }
            if(tempLangList.indexOf(tasks[i].language) < 0){
                tempLangList.push(tasks[i].language);
                langList.push({language:tasks[i].language});
            }
            if(tempVerList.indexOf(tasks[i].version) < 0){
                tempVerList.push(tasks[i].version);
                verList.push({version:tasks[i].version});
            }
        }
        console.log('langList', langList);
        //res.send('Finished ' + JSON.stringify(tasks));
        res.render('index', {tasks: JSON.stringify(tasks),taskList: taskList,langList: langList,verList: verList});
    });
});

/*
* Task Page!
* */
app.get(/\/[\w\s\+#]*\/[\d\.]*\/[\w\s]*/, function(req, res){
    var path = req.path.split('/');
    var language = decodeURIComponent(path[1]);
    var version = decodeURIComponent(path[2]);
    var task = decodeURIComponent(path[3]);

    if(!task || !language || !version){
        res.redirect('/');
        return;
    }

    rUtil.getPage(task, language, version, function( page ){
        // start a listener to the changefeed
        rUtil.listenToPage(page, function(page){
            console.log('page changed!', page);
        });

        // send the html
        res.render('task', {
            language: page.language,
            version: page.version,
            task: page.task,
            content: (page.content) ? page.content : ""
        });
    }, function(){
        res.status(404).send('Sorry cant find that!');
    });

});
// app.post(/\/[\w\s\+#]*\/[\d\.]*\/[\w\s]*/, function(req, res) {
//     var path = req.path.split('/');
//     var language = decodeURIComponent(path[1]);
//     var version = decodeURIComponent(path[2]);
//     var task = decodeURIComponent(path[3]);
//
//     if(!task || !language || !version){
//         res.redirect('/');
//         return;
//     }
//     rUtil.updatePage(language, version, task, req.body.content, function(success){
//         res.send({ success: success });
//         return;
//     });
// });

// Let's start with something simple
app.get('/rethink', function(req, res) {
    // var connection = rUtil.getConnection();
    // if(connection){
    //     console.log('connected successfully');
    // }else{
    //     console.log('something went wrong');
    // }
    // rUtil.createPage({
    //     task: "Hello World",
    //     language: "Gun",
    //     version: "0.3.7"
    // });
    res.send('finished');
});

// handle routes not found
app.use(function(req, res, next) {
    console.log('req path', req.path);
    res.status(404).send('Sorry cant find that!');
});

// handle errors
// app.use(function(err, req, res, next) {
//     console.error(err.stack);
//     res.status(500).send('Something broke!');
// });

/*
* Socket Listeners!
* */
io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('update page', function(args){
        console.log('updating page!', args);
        if(!args.task || !args.language || !args.version){
            // fail case
            console.log('error, params missing');
            return;
        }
        rUtil.updatePage(args.language, args.version, args.task, args.content, function(success){
            // possible success
            console.log('page content updated?', success ? 'yes':'no');
            return;
        });

    });
});

