
const { CallJSTAPI } = require("../utils/CallJSTAPI");

CallJSTAPI('open/jushuitan/itemsku/upload', {
    items: [
        {
            sku_id: "HMA125175-3E",
            i_id: '3711584',
            name: '数字油画G HMA125175-3E',
            labels: [
                '外贸定制',
                '数字油画',
                '有打布稿',
                '高美画坊',
                '无打布稿'
            ]
        }
    ]
}).then(function(res) {
    console.log(res.data.datas);
})