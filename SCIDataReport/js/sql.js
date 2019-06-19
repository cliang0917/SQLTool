/*--------------------------------------------------------------------------
* sql.js - SQL语句生成工具的SQL语句处理方法
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 保存当前查询
 */
function SaveSQL(){
    if($('#txtTitle').val() == ''){
        lu_layer.msg('标题必须输入！');
        return;
    }

    var _save = {};
    _save.primary = PRIMARY_TABLE;
    _save.less = LESS_TABLES;
    _save.join = LESS_TABLES_JOIN_RELATION;
    _save.condition = CONDITIONS;
    _save.selectcolumn = SELECT_COLUMNS;
    _save.tablecolumn = TABLE_COLUMNS;
    _save.datacolumn = DATA_COLUMNS;

    $.post('./api.ashx', { 
        method: 'save' , 
        title : $('#txtTitle').val() , 
        remark : $('#txtRemark').val() , 
        sql : JSON.stringify(_save) 
    }, function(result){
        if(result == "1"){
            lu_layer.closeAll();
            lu_layer.msg('保存成功', {icon: 1});
        }
    });
}

/**
 * 生成SQL语句
 */
function CreateSQL(){
    var _SELECT = 'select top 10';
    var _FIELD = '';
    var _FROM = '';
    var _INNER = '';
    var _WHERE = '';

    var _table = Enumerable.From(_t.datatables)
        .Where('$.table == "' + PRIMARY_TABLE + '"')
        .Select('$')
        .ToArray()[0];

    // 拼接列，如果有选择的列，优先显示选择的列，否则显示全部列
    var _FIELD_ARR = [];
    if(SELECT_COLUMNS.length > 0){
        $.each(SELECT_COLUMNS , function(index , item){
            _FIELD_ARR.push('    ' + item.table + '.' + item.column);
        });
    }
    else{
        // 找主表的列
        $.each(_table.table_columns , function(index , item){
            _FIELD_ARR.push('    ' + PRIMARY_TABLE + '.' + item.column);
        });
        // 找从表的列
        $.each(LESS_TABLES , function(index , item){
            var _less_table = Enumerable.From(_t.datatables)
                .Where('$.table == "' + item + '"')    
                .Select('$')
                .ToArray()[0];

            $.each(_less_table.table_columns , function(cIndex , cItem){
                _FIELD_ARR.push('    ' + item + '.' + cItem.column);
            });
        });
    }

    _FIELD = _FIELD_ARR.join(',\r\n');

    _FROM = 'from ' + PRIMARY_TABLE;

    $.each(LESS_TABLES_JOIN_RELATION , function(index , item){
        var _less_table = Enumerable.From(_t.datatables)
            .Where('$.table == "' + item.jointablename + '"')
            .Select('$')
            .ToArray()[0];

        $.each(_less_table.table_join , function(l_index , l_item){
            if(l_item.table == item.tablename){
                _INNER += 'inner join ' + l_item.table + ' on ' + l_item.table + '.' + l_item.primary_key + ' = ' + _less_table.table + '.' + l_item.foreign_key + '\r\n';
            }
        });
    })

    $.each(CONDITIONS , function(index , item){
        var _temp_where = TranslateConditions(item , 'where');
        if(index == 0)
            _WHERE += "where " + _temp_where + '\r\n';
        else
            _WHERE += "and " + _temp_where + '\r\n';
    });

    var _SQL = _SELECT + '\r\n' + _FIELD  + '\r\n'+ _FROM + '\r\n' + _INNER + _WHERE + '\r\n';
    $('#txtSql').val(_SQL);
}

/**
 * 生成导出数据的SQL脚本
 */
function CreateImportSQL(){
    var _SELECT = 'select';
    var _FIELD = '';
    var _FROM = '';
    var _INNER = '';
    var _WHERE = '';

    var _table = Enumerable.From(_t.datatables)
        .Where('$.table == "' + PRIMARY_TABLE + '"')
        .Select('$')
        .ToArray()[0];

    // 拼接列，如果有选择的列，优先显示选择的列，否则显示全部列
    var _FIELD_ARR = [];
    if(SELECT_COLUMNS.length > 0){
        $.each(SELECT_COLUMNS , function(index , item){
            _FIELD_ARR.push('    ' + item.table + '.' + item.column + ' as ' + item.column_name);
        });
    }
    else{
        // 找主表的列
        $.each(_table.table_columns , function(index , item){
            _FIELD_ARR.push('    ' + PRIMARY_TABLE + '.' + item.column + ' as ' + item.column_name);
        });
        // 找从表的列
        $.each(LESS_TABLES , function(index , item){
            var _less_table = Enumerable.From(_t.datatables)
                .Where('$.table == "' + item + '"')
                .Select('$')
                .ToArray()[0];

            $.each(_less_table.table_columns , function(cIndex , cItem){
                _FIELD_ARR.push('    ' + item + '.' + cItem.column + ' as ' + cItem.column_name);
            });
        });
    }

    _FIELD = _FIELD_ARR.join(',\r\n');

    _FROM = 'from ' + PRIMARY_TABLE;

    $.each(LESS_TABLES_JOIN_RELATION , function(index , item){
        var _less_table = Enumerable.From(_t.datatables)
            .Where('$.table == "' + item.jointablename + '"')
            .Select('$')
            .ToArray()[0];

        $.each(_less_table.table_join , function(l_index , l_item){
            if(l_item.table == item.tablename){
                _INNER += 'inner join ' + l_item.table + ' on ' + l_item.table + '.' + l_item.primary_key + ' = ' + _less_table.table + '.' + l_item.foreign_key + '\r\n';
            }
        });
    })

    $.each(CONDITIONS , function(index , item){
        var _temp_where = TranslateConditions(item , 'where');
        if(index == 0)
            _WHERE += "where " + _temp_where + '\r\n';
        else
            _WHERE += "and " + _temp_where + '\r\n';
    });

    var _SQL = _SELECT + '\r\n' + _FIELD  + '\r\n'+ _FROM + '\r\n' + _INNER + _WHERE + '\r\n';
    
    return _SQL;
}
