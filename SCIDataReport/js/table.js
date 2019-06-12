/*--------------------------------------------------------------------------
* table.js - SQL语句生成工具中表的相关处理
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 从表处理事件
 */
function LessTable(){
    if(PRIMARY_TABLE == ''){
        lu_layer.msg('请选择一个主表!');
        return;
    }

    LessTableBind();

    // 找主表可关联的表，并启用
    LessTableLoading(PRIMARY_TABLE);
    // 找从表可关联的表，并启用
    $.each(LESS_TABLES , function(_index , item){
        LessTableLoading(item);
    });

    OpenLayer(1 , $('#AddLessList') , '添加从表' , '20%' , '50%');
}

/**
 * 绑定从表，并全部禁用
 */
function LessTableBind(){
    $('#AddLessList').empty();
    $.each(_t.datatables , function(_index , item){
        $('#AddLessList').append('<div class="layui-form-item"><button type="button" class="layui-btn layui-btn-normal" value="' + item.table + '" onclick="LessTableSelect(\'' + item.table + '\' , \'' + item.table_name + '\')">' + item.table_name + '</button></div>');
    });
    lu_form.render();

    // 全部禁用
    $('#AddLessList').find('button').each(function(_index , item){
        $(item).addClass('layui-btn-disabled');
        item.disabled = true;
    });
}

/**
 * 加载可以选择的从表
 * @param {string} _table - 表名（英文）
 */
function LessTableLoading(_table){
    var _table_join = Enumerable.From(_t.datatables)
        .Where('$.table == "' + _table + '"')
        .Select('$.table_join')
        .ToArray()[0];
    
    $.each(_table_join , function(_index , item){
        if($.inArray(item.table , LESS_TABLES) == -1){
            var _btn = $('#AddLessList').find('button[value="' + item.table + '"]');
            _btn.removeClass('layui-btn-disabled');
            _btn.attr('disabled',false);
            _btn.attr('fromjoin' , _table);
        }
    });
}

/**
 * 从表选择
 * @param {string} _less_table 
 * @param {string} _less_tablename 
 */
function LessTableSelect(_less_table, _less_tablename){
    var _obj_join = {};
    _obj_join.tablename = _less_table;
    _obj_join.jointablename = $('#AddLessList').find('button[value="' + _less_table + '"]').attr('fromjoin');

    TABLE_COLUMNS = [];
    DATA_COLUMNS = [];

    LESS_TABLES.push(_less_table);
    LESS_TABLES_JOIN_RELATION.push(_obj_join);

    CreateSQL();
    CollectColumns();

    $('#less_list').append('<span class="layui-dc-circle" lesstable="' + _less_table + '">' + _less_tablename + '<i onclick="LessTableDelete(\'' + _less_table + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');
    lu_layer.closeAll();
}

/**
 * 从表删除
 * @param {string} _less_table 
 */
function LessTableDelete(_less_table){
    lu_layer.confirm('确定要删除此表么？', {
        btn: ['确定','取消']
    }, function(){
        TABLE_COLUMNS = [];
        DATA_COLUMNS = [];
        JoinRelationDelete(_less_table);
        // 删除表
        LESS_TABLES.splice($.inArray(_less_table , LESS_TABLES) , 1);
        // 删除提示
        $('.layui-dc-circle[lesstable="' + _less_table + '"]').remove();
        for(let i = LESS_TABLES_JOIN_RELATION.length - 1 ; i >= 0 ; i--)
        {
            if(LESS_TABLES_JOIN_RELATION[i].tablename == _less_table){
                // 删除关联关系
                LESS_TABLES_JOIN_RELATION.splice(i, 1);
            }
        }
        // 删除自定义选择的列
        DeleteLessTableSelectColumns(_less_table);
        // 删除相应的条件
        DeleteContionByTable(_less_table);

        // 重新生成SQL语句
        CreateSQL();
        CollectColumns();
        lu_layer.msg('删除成功', {icon: 1});

    }, function(){
        console.log('取消');
    });
}

/**
 * 删除迭代的JOIN关系
 * @param {string} _less_table - 删除的从表名称（英文） 
 */
function JoinRelationDelete(_less_table){
    // 找跟删除表关联的表，先删掉
    for(let i = LESS_TABLES_JOIN_RELATION.length - 1 ; i >= 0 ; i--)
    {
        if(LESS_TABLES_JOIN_RELATION[i].jointablename == _less_table){
            var _tablename = LESS_TABLES_JOIN_RELATION[i].tablename;
            // 删除表
            LESS_TABLES.splice($.inArray(_tablename , LESS_TABLES) , 1);
            // 删除提示
            $('.layui-dc-circle[lesstable="' + _tablename + '"]').remove();
            // 删除关联关系
            LESS_TABLES_JOIN_RELATION.splice(i, 1);
            // 删除自定义选择的列
            DeleteLessTableSelectColumns(_tablename);
            // 迭代删除
            JoinRelationDelete(_tablename);
            // 删除相应的条件
            DeleteContionByTable(_tablename);
        }
    }
}