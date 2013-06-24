module.exports = {
    _id: '_design/objects',
    views: {
        all: { 
            map: function(doc) { 
                if(doc.type == 'object') {
//                    emit(doc.last_changed_time, doc);
                    emit(doc.name, doc);
                }
            }
        }
    }
}