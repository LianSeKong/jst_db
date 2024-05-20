const { CallJSTAPI } = require("../utils/CallJSTAPI");



CallJSTAPI('open/webapi/orderapi/questionorder/questions', {

    o_ids: [9349705],
    channel: '李鹏飞',
    question_type: '标记异常',
    question_desc: '不明确分销(转换订单类型时判断：不能通过分销规则自动判断供销商)'
}).then(function(res) {
    console.log(res);
    CallJSTAPI('open/order/action/query', {
        page_index: 1,
        page_size: 50,
        o_id: 9349705
    }).then(function(res) {
        console.log(res.data.datas);
    })
    
})


