




module.exports.foramtRequestError=  function (biz,msg, response) {
    console.log(`-----------------------------------------------------
开始时间： ${biz.modified_begin}，
结束时间： ${biz.modified_end},
当前页数： ${biz.page_index},
${msg}
发生了如下请求错误： ${JSON.stringify(response)}`);
}

module.exports.foramtRequestDBInsert = function (biz, msg,  response) {
    console.log(`--------------------------------------------------------
开始时间： ${biz.modified_begin}，
结束时间： ${biz.modified_end},
插入数据量： ${JSON.stringify(response)},
数据库名： ${msg}`);
}

