var socket = io();

function doSomething(language, version, task, content){
    console.log('I got called with', language, version, task, content);
    socket.emit('update page', {
        language: language,
        version: version,
        task: task,
        content: content
    });
    // $.ajax({
    //     method: "POST",
    //     url: '/'+language+'/'+version+'/'+task,
    //     data: { content: content }
    // })
    //     .done(function( response ) {
    //         console.log( "Data Saved: ", response );
    //     });
}