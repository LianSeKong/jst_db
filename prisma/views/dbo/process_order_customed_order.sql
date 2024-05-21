WITH [当前开发部设计任务清单] AS (
  SELECT
    [task_status] AS [是否启用],
    [task_datetime] AS [任务时间],
    [task_classification] AS [任务分类],
    [color_number] AS [颜色数],
    [developer] AS [开发师],
    [status] AS [设计进度],
    [abnormal_cause] AS [异常原因],
    [note] AS [备注],
    [commodity_code] AS [商品编码],
    [Style_code] AS [款式编码],
    [sku_kind] AS [商品类型],
    [sku_category] AS [商品品类],
    [sku_map] AS [商品销售地],
    [shop_attribute] AS [商品额外属性],
    [latest_version_number] AS [最新版本号],
    [internal_order_number] AS [内部订单号],
    [order_note] AS [订单备注],
    [urgent_task] AS [紧急任务],
    [folder_naming] AS [文件夹命名],
    [draft_title] AS [打布稿标题命名]
  FROM
    [Departments].[dbo].[task_product_layout_design]
),
[照片绣订单推单清单] AS (
  SELECT
    DISTINCT [内部订单号] AS [erp_order_id],
    [商品品类] AS [sku_category],
    [商品销售地] AS [sku_map]
  FROM
    [当前开发部设计任务清单]
  WHERE
    [是否启用] = 1
    AND [商品类型] = '照片绣'
    AND [设计进度] = '已审核'
)
SELECT
  *
FROM
  [照片绣订单推单清单];