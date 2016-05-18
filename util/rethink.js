var r = require('rethinkdb');
var connection = null;

var init = function( callback ){
    r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
        if (err){
            console.log('connection error', err);
            throw err;
        }
        callback(conn);
    });
};

var getConnection = function( callback ){
    if(connection){
        callback(connection);
        return;
    }
    init(function(conn){
        connection = conn;
        callback(conn);
    });
};

var createPage = function( task, lang, ver, callback ){
    getConnection(function(connection){

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
    });
};

module.exports = {
    getConnection: function(callback){
        getConnection(callback);
    },
    createPage: function( opt, callback ){
        if( !opt.task ){ throw "Task is required"; }
        if( !opt.language ){ throw "Language is required"; }
        if( !opt.version ){ throw "Version is required"; }

        createPage( opt.task, opt.language, opt.version, callback);
    },
    getTasks: function( callback ){
        getConnection(function(connection){
            r.table('index').run(connection, function(err, cursor) {
                if (err) throw err;
                cursor.toArray(function(err, result) {
                    if (err) throw err;
                    callback( result );
                });
            });
        });
    },
    getPage: function(task, language, version, success, fail){
        getConnection(function(connection){
            r.table('page').filter({
                task: task,
                language: language,
                version: version
            }).run(connection, function(err, cursor){
                if(err) fail();
                cursor.toArray(function(err, result){
                    if(err) fail();
                    if(result.length < 1) fail();
                    success(result[0]);
                })
            });
        });
    },
    updatePage: function(language, version, task, content, success){
        getConnection(function(connection){
            r.table('page').filter({
                task: task,
                language: language,
                version: version
            }).update({content: content}).run(connection, function(err, cursor){
                if(err) success(false);
                success(true);
            });
        });
    },
    listenToPage: function(page, callback){
        console.log('Trying to set up a listener', page);
        getConnection(function(connection){
            r.table('page').changes()./*filter({
                task: page.task,
                language: page.language,
                version: page.version
            }).*/run(connection, function(err, cursor){
                console.log('cursor', cursor);
                if(err) throw err;
                cursor.each(function(rec){
                    console.log('rec', rec);
                    callback(rec);
                });
            });
        });
    }
}
;