const { CallJSTAPI } = require("../utils/CallJSTAPI");
// 根据sku查询数据库视图中的sku_id
//
function  getOrderArray () {
    // 查询数据库
    // 获取数据

    return []

}

/**
 * 
    1、如备注包含"需要效果图"，则将“需要效果图”修改为“待确认效果图”
    2、如备注包含"换图"，则将“换图”修改为“待确认效果图”
    3、如备注包含"重新设计"，则将“重新设计”修改为“待确认效果图”
 */

/**
 * 
 * @param { Array } data  需要修改的备注及内部单号
 */

async function updateNotes(data) {
  for (const item of data) {
    await CallJSTAPI('open/jushuitan/order/remark', { 
      o_id: item.o_id,
      remark: item.remark
     })
  }
}

async function begin() {
  await updateNotes(getOrderArray())
  console.log('修改成功');
}
