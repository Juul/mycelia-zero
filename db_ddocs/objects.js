module.exports = {
    _id: '_design/objects',
    views: {
        by_name: { 
            map: function(doc) { 
                if(doc.type == 'object') {
                    emit(doc.name+'-'+doc._id, doc);
                }
            }
        },
        recent: { 
            map: function(doc) { 
                if(doc.type == 'object') {
//                    emit(doc.name+'-'+doc._id, doc);
                    emit(doc.created_time+'-'+doc._id, doc);
                }
            }
        }
    }
}