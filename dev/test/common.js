

/**
 * 
 * @param {*} biz 
 * @param {Object : {isOper: boolean, list: Array}} params 
 * @param {*} URL 
 * @param { Function } database
 * @returns 
 */
async function onTicK(biz, params, URL, database) {
    


  // 接口调用阻塞中
  if (params.isOper) return; // 正在数据库操作则直接进行下一次轮询

  if (list.length > 2000) {
    params.isOper = true
    list = await database()
    params.isOper = false
  }

  // 数据量达到阈值则进行数据库操作，阻塞接口调用
  if (list.length > 2000) {
    isOper = true;
    list = await operateDB(list);
    isOper = false;
    return;
  }

  // 数据获取完毕
  if (hasNext === false) {
    this.stop();
    return;
  }

  try {
    //发送请求，获取数据
    const response = await CallJSTAPI(URL, biz);
    // 请求出错, 抛出错误
    if (response.code !== 0) {
      reject(formatResponseError("组合装商品资料", biz, response.msg));
      return;
    }

    const { data } = response;
    const { datas = [], has_next = false } = data;

    if (datas instanceof Array) {
      list.push(...datas);
    }

    // 下次循环
    hasNext = has_next;
    biz.page_index++;
  } catch (error) {
    reject("调用组合装商品资料接口时出现错误： ", error.message);
  }
}
