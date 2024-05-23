const { CallJSTAPI } = require("../utils/CallJSTAPI");

const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin: '2024-05-21',
    modified_end: '2024-05-23',
    "po_ids": [],
    "so_ids": [],
  };
CallJSTAPI("open/purchase/query", biz).then(
    res => {
        console.log(res.data.datas);
    }
)