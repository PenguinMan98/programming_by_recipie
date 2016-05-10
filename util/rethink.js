var r = require('rethinkdb');
var connection = null;

var init = function(){
    console.log('rethink util init');
    r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
        if (err) throw err;
        connection = conn;
    });
    if(connection){
        console.log('rethinkdb is now connected!', connection);
        return true;
    }
    return false;
};

var getConnection = function(){
    console.log('getConnection');
    if(connection){
        return connection;
    }
    if(init()){
        return connection();
    }else{
        throw "Could not connect to the rethink db!";
    }
};

var createPage = function( task, lang, ver, callback ){
    console.log('create a page!', task, lang, ver );
    var connection = getConnection();
    r.table('index').insert({
        task: task,
        language: lang,
        version: ver
    }).run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });
    r.table('page').insert({
        task: task,
        language: lang,
        version: ver,
        type: '',
        group: '',
        prior: '',
        usage: '',
        alternatives: ''
    }).run(connection, function(err, result) {
        if (err) throw err;
        console.log(JSON.stringify(result, null, 2));
    });

    if(typeof callback == 'function'){
        callback();
    }
};

module.exports = {
    getConnection: function(){
        console.log('module exports getConnection');
        return getConnection();
    },
    createPage: function( opt, callback ){
        if( !opt.task ){ throw "Task is required"; }
        if( !opt.language ){ throw "Language is required"; }
        if( !opt.version ){ throw "Version is required"; }

        createPage( opt.task, opt.language, opt.version, callback);
    },
    getTasks: function( callback ){
        var connection = getConnection();
        r.table('index').run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.toArray(function(err, result) {
                if (err) throw err;
                callback( result );
            });
        });
    }
};