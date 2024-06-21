const fs = require('fs')
const path = require('path')
const moment = require('moment')



const foramtTime = (m) => {
    return m.format("YYYY-MM-DD HH:mm:ss")
}


const getJSTConfig = () => {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, './config/jst.json'), 'utf8'))
}

const refreshJSTConfig = ({ refresh_token,  expires_in, access_token}) => {
    const config = getJSTConfig()
    config.refresh_token = refresh_token
    config.expires_in = expires_in
    config.access_token = access_token
    config.generate = foramtTime(new moment())
    fs.writeFileSync(path.resolve(__dirname,'./config/jst.json'), JSON.stringify(config, null, 4))
}

const foramtRequestError =   (biz, name, msg) => {
    return `
开始时间： ${biz.modified_begin}，
结束时间： ${biz.modified_end},
当前页数： ${biz.page_index},
接口名称： ${name}
错误信息： ${msg}`
;


}

const foramtRequestDBInsert = (biz, msg,  response) => {
return `-------------------------------------------------------
开始时间： ${biz.modified_begin}，
结束时间： ${biz.modified_end},
插入数据量： ${JSON.stringify(response)},
数据库名： ${msg}`;
}

module.exports = {
    foramtRequestDBInsert,
    foramtRequestError,
    foramtTime,
    refreshJSTConfig,
    getJSTConfig,
}