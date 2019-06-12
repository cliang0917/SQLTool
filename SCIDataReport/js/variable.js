/*--------------------------------------------------------------------------
* variable.js - SQL语句生成工具使用的变量，集中声明及注释
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 数据源，读取JSON文件
 */
var _t;

/**
 * LayUI 相关组件
 */
var lu_element , lu_form , lu_table , lu_layer , lu_laydate;

/**
 * 主表
 */
var PRIMARY_TABLE = '';

/**
 * 从表数组
 */
var LESS_TABLES = [];

/**
 * 从表的JOIN关系
 */
var LESS_TABLES_JOIN_RELATION = [];

/**
 * 条件数组
 */
var CONDITIONS = [];

/**
 * 选择的需要查询的列，用于生成SQL语句的查询列部分
 */
var SELECT_COLUMNS = [];

/**
 * 所有表的所有列，用于添加条件，当 * SELECT_COLUMNS * 为空时，也用于生成SQL语句的查询列部分
 */
var TABLE_COLUMNS = [];

/**
 * 预览表格的表头数组，用于生成预览表格
 */
var DATA_COLUMNS = [];