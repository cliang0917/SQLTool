/*--------------------------------------------------------------------------
* column.js - SQL语句生成工具中列的相关处理
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 自定义列弹窗初始化
 */
function ChooseColumnInit(){
    if(PRIMARY_TABLE == ''){
        lu_layer.msg('至少选择一个表!');
        return;
    }

    // 加载表
    $('#choose_columns_list').empty();
    $('#choose_columns_from').empty();

    $('#choose_columns_list').append('<option value="">直接选择或搜索选择</option>');
    var _pri_table = SearchTable(PRIMARY_TABLE);
    $('#choose_columns_list').append('<option value="' + _pri_table.table + '">' + _pri_table.table_name + '</option>');

    $.each(LESS_TABLES , function(index , item){
        var _le_table = SearchTable(item);
        $('#choose_columns_list').append('<option value="' + _le_table.table + '">' + _le_table.table_name + '</option>');
    });
    lu_form.render('select');

    OpenLayer(1 , $('#ChooseColumn') , '设置查询列' , '30%' , '60%');
}

/**
 * 自定义查询列弹窗中-表选择事件
 */
function ChooseColumnTableSelect(data){
    $('#choose_columns_from').empty();
    if(data.value != ''){
        var _obj_table = SearchTable(data.value);
        $.each(_obj_table.table_columns, function(index , item){
            var _guid = Guid();
            var _table = data.value;
            var _table_name = _obj_table.table_name;
            var _column = item.column;
            var _colunm_name = item.column_name;
            var _column_type = item.column_type;

            var _obj = {};
            _obj.guid = _guid;
            _obj.table = _table;
            _obj.tablename = _table_name;
            _obj.column = _column;
            _obj.column_name = _colunm_name;
            _obj.column_type = _column_type;

            var _temp_btn_html = '';
            _temp_btn_html += '<div class="layui-form-item" guid="' + _guid + '" table="' + _table + '" column="' + _column + '">';
            _temp_btn_html += '    <button type="button" class="layui-btn-circle layui-btn-normal layui-btn-radius" onclick=ChooseSelectColumns(\'' + JSON.stringify(_obj) + '\')>';
            _temp_btn_html += '        <i style="font-size:12px;" class="layui-icon">&#xe654;</i>';
            _temp_btn_html += '    </button>';
            _temp_btn_html += '    <span style="margin-left:10px;" class="layui-badge">' + item.column_name + '</span>';
            _temp_btn_html += '</div>';

            $('#choose_columns_from').append(_temp_btn_html);
        });
        DisabledSelectColumns();
    }
}

/**
 * 添加自定义列
 * @param {string} _obj_str - 自定义列的对象的JSON字符串
 */
function ChooseSelectColumns(_obj_str){
    var _obj = JSON.parse(_obj_str);

    // 加到右边
    var _guid = Guid();
    var _temp_btn_html = '';
    _temp_btn_html += '<div class="layui-form-item" guid="' + _guid + '" table="' + _obj.table + '" column="' + _obj.column + '">';
    _temp_btn_html += '    <button type="button" class="layui-btn-circle layui-btn-normal layui-btn-radius" onclick="DeleteSelectColumns(\'' + _guid + '\' , \'' + _obj.table + '\' , \'' + _obj.column + '\');">';
    _temp_btn_html += '        <i style="font-size:12px;" class="layui-icon">―</i>';
    _temp_btn_html += '    </button>';
    _temp_btn_html += '    <span style="margin-left:10px; cursor: move;" class="layui-badge noselect">' + _obj.tablename + '的' + _obj.column_name + '</span>';
    _temp_btn_html += '</div>';

    $('#choose_columns_to').append(_temp_btn_html);
    $('#choose_columns_to').find('div').arrangeable({
        dragSelector: '.layui-badge'
    });

    // 添加到数组
    SELECT_COLUMNS.push(_obj);

    // 设置左边为不可用
    DisabledSelectColumns();

    // 重新生成SQL语句
    CreateSQL();
    CollectSelectColumns();
}

/**
 * 删除自定义列
 * @param {string} _guid - 唯一标识
 * @param {string} _table - 表名
 * @param {string} _column - 列名
 */
function DeleteSelectColumns(_guid , _table , _column){
    // 从数组中删除
    for(let i = 0; i < SELECT_COLUMNS.length; i++){
        if(SELECT_COLUMNS[i].table == _table && SELECT_COLUMNS[i].column == _column){
            SELECT_COLUMNS.splice(i, 1);
        }
    }

    // 删除右侧元素
    $('#choose_columns_to').find('div[guid="' + _guid + '"]').remove();

    // 重置左边为不可用
    DisabledSelectColumns();

    // 重新生成SQL语句
    CreateSQL();
    CollectSelectColumns();
}

/**
 * 自定义列拖动结束后，重新排序
 */
function SortSelectColumns(){
    var _temp_select = [];
    $.each($('#choose_columns_to').find('div'), function(index , item){
        var _table = $(this).attr('table');
        var _column = $(this).attr('column');
        var _select_obj = Enumerable.From(SELECT_COLUMNS)
            .Where('$.column == "' + _column + '" && $.table == "' + _table + '"')
            .Select('$')
            .ToArray()[0];
        _temp_select.push(_select_obj);
    });
    SELECT_COLUMNS = _temp_select;

    // 重新生成SQL语句
    CreateSQL();
    CollectSelectColumns();
}

/**
 * 收集列的信息，并创建 TABLE_COLUMNS 和 DATA_COLUMNS
 */
function CollectColumns(){
    // 组装主表
    var _table = Enumerable.From(_t.datatables)
        .Where('$.table == "' + PRIMARY_TABLE + '"')
        .Select('$')
        .ToArray()[0];
    $.each(_table.table_columns , function(_index , item){
        CreateTableColumn(item , PRIMARY_TABLE , _table.table_name);
        // 如果没有自选列，则把主表的列全部加入预览表格的表头
        if(SELECT_COLUMNS.length == 0)
            CreateDataColumn(item , PRIMARY_TABLE , _table.table_name);
    });

    // 组装从表
    $.each(LESS_TABLES , function(_index , item){
        var _less_table = Enumerable.From(_t.datatables)
            .Where('$.table == "' + item + '"')
            .Select('$')
            .ToArray()[0];

        $.each(_less_table.table_columns , function(_cIndex , cItem){
            CreateTableColumn(cItem , item , _less_table.table_name);
            // 如果没有自选列，则把从表的列全部加入预览表格的表头
            if(SELECT_COLUMNS.length == 0)
                CreateDataColumn(cItem , item , _less_table.table_name);
        });
    });
}

/**
 * 收集自定义列的信息，并创建 DATA_COLUMNS
 */
function CollectSelectColumns(){
    DATA_COLUMNS = [];

    $.each(SELECT_COLUMNS , function(_index , item){
        CreateDataColumn(item , item.table , item.tablename);
    });
}

/**
 * 删除从表时，把从表的自定义列也同时删除
 * @param {string} _less_table - 从表名称（英文）
 */
function DeleteLessTableSelectColumns(_less_table){
    // 从数组中删除
    for(let i = SELECT_COLUMNS.length - 1; i >=0 ; i--){
        if(SELECT_COLUMNS[i].table == _less_table){
            SELECT_COLUMNS.splice(i, 1);
        }
    }

    // 删除右侧元素
    $('#choose_columns_to').find('div[table="' + _less_table + '"]').remove();
    // 重置左边为不可用
    DisabledSelectColumns();

    // 重新生成SQL语句
    CreateSQL();
    CollectSelectColumns();
}

/**
 * 禁用已选中的查询列，防止重复选择
 */
function DisabledSelectColumns(){
    $.each($('#choose_columns_from').find('div') , function(_index , _item){
        $(this).find('button').removeClass('layui-btn-disabled');
        $(this).find('button').attr('disabled', false);
        $(this).find('.layui-badge').removeClass('layui-bg-gray');
    });

    $.each(SELECT_COLUMNS , function(_index , item){
        var _div = $('#choose_columns_from').find('div[table="' + item.table + '"][column="' + item.column + '"]');
        _div.find('button').addClass('layui-btn-disabled');
        _div.find('button').attr('disabled', true);
        _div.find('.layui-badge').addClass('layui-bg-gray');
    });
}

/**
 * 创建 TABLE_COLUMNS - 用于添加条件，当 * SELECT_COLUMNS * 为空时，也用于生成SQL语句的查询列部分
 * @param {object} _item - 列对象
 * @param {string} _table - 表名（英文）
 * @param {string} _tablename - 表名（中文）
 */
function CreateTableColumn(_item , _table , _tablename){
    TABLE_COLUMNS.push({ 
        tablename: _tablename ,
        table: _table ,
        field: _item.column , 
        title: _item.column_name , 
        type: _item.column_type 
    });
}

/**
 * 创建 DATA_COLUMNS - 预览表格的表头数组，用于生成预览表格
 * @param {object} _item - 列对象
 * @param {string} _table - 表名（英文）
 * @param {string} _tablename - 表名（中文）
 */
function CreateDataColumn(_item , _table , _tablename){
    if(_item.column_type == 'date')
        DATA_COLUMNS.push({ 
            tablename: _tablename ,
            table: _table ,
            field: _item.column , 
            title: _item.column_name , 
            type: _item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + _item.column + ')).format("YYYY-MM-DD")}}</span>'
        });
    else if(_item.column_type == 'datetime')
        DATA_COLUMNS.push({ 
            tablename: _tablename ,
            table: _table ,
            field: _item.column , 
            title: _item.column_name , 
            type: _item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + _item.column + ')).format("YYYY-MM-DD hh:mm:ss")}}</span>'
        });
    else 
        DATA_COLUMNS.push({ 
            tablename: _tablename ,
            table: _table ,
            field: _item.column , 
            title: _item.column_name ,
            type: _item.column_type
        });
}