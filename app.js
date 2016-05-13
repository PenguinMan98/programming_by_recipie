var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();

var rUtil = require('./util/rethink');

// initialize the templating engine
app.set('views', './views');
app.engine('handlebars', exphbs({defaultLayout: 'home'}));
app.set('view engine', 'handlebars');

// listen on this port
app.listen(9876, function(){
    console.log('This is my example app running');
});

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

    res.render('task', {language: language, version: version, task: task});
});

// Let's start with something simple
app.get('/rethink', function(req, res) {
    var connection = rUtil.getConnection();
    if(connection){
        console.log('connected successfully');
    }else{
        console.log('something went wrong');
    }
    // rUtil.createPage({
    //     task: "Hello World",
    //     language: "Gun",
    //     version: "0.3.7"
    // });
    res.send('finished');
});

// handle routes not found
app.use(function(req, res, next) {
    res.status(404).send('Sorry cant find that!');
});

// handle errors
// app.use(function(err, req, res, next) {
//     console.error(err.stack);
//     res.status(500).send('Something broke!');
// });