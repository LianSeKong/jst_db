const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { prisma } = require("../utils/dbConnect");

// 根据sku查询数据库视图中的sku_id

async function getOrderArray () {
    // 查询数据库
    // 获取数据
    return await prisma.edit_order_note_confirm_layout.findMany()

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
      o_id: item.erp_order_id,
      remark: item.order_note_new
     })
  }
}

async function begin() {
  await updateNotes(await getOrderArray())
  console.log('修改成功');
}
