/*--------------------------------------------------------------------------
* common.js - SQL语句生成工具的公共方法
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 查询表
 * @param {string} _tablename - 表名（英文）
 */
function SearchTable(_tablename){
    var _table = Enumerable.From(_t.datatables)
        .Where('$.table == "' + _tablename + '"')
        .Select('$')
        .ToArray()[0];
    return _table;
}

/**
 * 公用弹窗方法
 * @param {int} _type - 弹窗类型
 * @param {object} _content - 弹窗容器
 * @param {string} _title - 标题
 * @param {string} _width - 宽度，可以为百分比或者数字
 * @param {string} _height - 高端，可以为百分比或者数字
 */
function OpenLayer(_type , _content , _title , _width , _height){
    lu_layer.open({
        type: _type,
        content: _content,
        title: _title,
        area: [_width, _height]
    });
}

/**
 * 重置所有内容
 */
function ResetAll(){
    PRIMARY_TABLE = '';
    LESS_TABLES = [];
    LESS_TABLES_JOIN_RELATION = [];
    CONDITIONS = [];
    SELECT_COLUMNS = [];
    TABLE_COLUMNS = [];
    DATA_COLUMNS = [];

    $('#less_list').find('.layui-dc-circle').remove(); // 清理从表
    $('#con_list').find('.layui-dc-circle').remove(); // 清理查询条件
    $('#choose_columns_to').empty(); // 清理自定义选择的列
}

/**
 * 处理关键字特殊字符，去除空字符
 * @param {string} keyword - 关键字
 */
function SpecialKeyWord(keyword){
    var _keyword = keyword.replace(/\r\n/g,"").replace(/\n/g,"").replace(/，/g,","); 
    var _keys = _keyword.split(',');
    var _keys_result = [];
    for(i = 0; i < _keys.length; i++){
        if(_keys[i] != ''){
            _keys_result.push(_keys[i]);
        }
    }

    return _keys_result;
}

/**
 * 给条件转义的关键字加样式表，突出显示
 * @param {string} _key -- 内容
 */
function TranTipAddClass(_key){
    return '<span class="condition-tip">' + _key + '</span>';
}

/**
 * 生成Guid
 */
function Guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}