const axios = require('axios')
/**
 * 
 * @param { Object } param0 
 * @param { String } param0.modified_begin
 * @param { String } param0.modified_end
 * @param { Number } param0.count
 * @param { String } param0.database_name
 * @param { String } param0.note
 * @param { Boolean } param0.status
 */
const createLog = async ( 
    modified_begin,
    modified_end,
    count,
    database_name,
    note,
    status) => {

   const result =  await axios.post('http://oa.m.com/items/jst_run_log', {
    begin_datetime: modified_begin,
    end_datetime:  modified_end,
        count,
        database_name,
        note,
        status
    }, {
        params: {
            access_token: 'ZhLYyVxKnTCFktRuA4jAHBl9uLwACLBn'
        }
    })

    return result
}

module.exports = { createLog }