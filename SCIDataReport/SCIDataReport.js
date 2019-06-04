var _t; // 数据源
var lu_element , lu_form , lu_table , lu_layer , lu_laydate; // LayUI 相关组件
var PRIMARY_TABLE = ''; // 主表
var LESS_TABLES = []; // 从表
var LESS_TABLES_JOIN_RELATION = []; // 从表的join关系
var CONDITIONS = []; // 条件
var TABLE_COLUMNS = []; // 预览表格的表头数组

$.getJSON('./SCIDataReport/SCIDataStructure.json', function (_source) {
    _t = _source;
    
    layui.use(['element', 'form', 'table', 'layer', 'laydate'], function () {
        lu_element = layui.element ,
        lu_form = layui.form ,
        lu_table = layui.table ,
        lu_layer = layui.layer ,
        lu_laydate = layui.laydate ;

        BindDataTable();
        BindBaseEvent();
    });
});

// 绑定表格
function BindDataTable(){
    $.each(_t.datatables , function(index , item){
        $('#primary_list').append('<input type="radio" name="rd-primary" lay-filter="rd-primary" value="' + item.table + '" title="' + item.table_name + '" />');
    });
    lu_form.render();
}

// 绑定事件
function BindBaseEvent(){
    // 使用帮助
    $('#btnHelp').click(function(){
        OpenLayer(1 , $('#useHelp') , '使用帮助' , '80%' , '80%');
    });

    // 更新日志
    $('#btnLog').click(function(){
        OpenLayer(1 , $('#updateLog') , '更新日志' , '80%' , '80%');
    });

    // 添加从表
    $('#btnAddLessList').click(function(){
        if(PRIMARY_TABLE == ''){
            lu_layer.msg('请选择一个主表!');
            return;
        }

        $('#AddLessList').empty();
        $.each(_t.datatables , function(index , item){
            $('#AddLessList').append('<div class="layui-form-item"><button type="button" class="layui-btn layui-btn-normal" value="' + item.table + '" onclick="LessTableSelect(\'' + item.table + '\' , \'' + item.table_name + '\')">' + item.table_name + '</button></div>');
        });
        lu_form.render();

        // 先全部禁用和取消选中
        $('#AddLessList').find('button').each(function(index , item){
            $(item).addClass('layui-btn-disabled');
            item.disabled = true;
        });

        // 找主表可关联的表，并启用
        LessTableLoading(PRIMARY_TABLE);
        // 找从表可关联的表，并启用
        $.each(LESS_TABLES , function(index , item){
            LessTableLoading(item);
        });

        OpenLayer(1 , $('#AddLessList') , '添加从表' , '20%' , '50%');
    });

    // 添加条件
    $('#btnAddLayer').click(function(){
        if(PRIMARY_TABLE == ''){
            lu_layer.msg('请选择一个主表!');
            return;
        }

        // 重置
        ResetConditionLayer();
        // 绑定列
        $('#condition_list').empty();
        $('#condition_list').append('<option value="">直接选择或搜索选择</option>');
        
        $.each(TABLE_COLUMNS , function(index , item){
            var _value = item.table + '.' + item.field;
            var _disabled = '';
            $.each(CONDITIONS , function(conIndex , conItem){
                if(conItem.field == _value){
                    _disabled = 'disabled';
                }
            });

            $('#condition_list').append('<option value="' + _value + '" column_type="' + item.type + '" ' + _disabled + '>' + item.title + '</option>');
        });
        lu_form.render('select');

        OpenLayer(1 , $('#AddCondition') , '添加条件' , '60%' , '80%');
    });

    // 主表选择事件
    lu_form.on('radio(rd-primary)', function(data){
        //重置
        LESS_TABLES = [];
        LESS_TABLES_JOIN_RELATION = [];
        CONDITIONS = [];
        TABLE_COLUMNS = [];
        $('#less_list').find('.layui-dc-circle').remove();
        $('#con_list').find('.layui-dc-circle').remove();

        // 生成SQL
        PRIMARY_TABLE = data.value;
        CreateSQL();

        CollectColumns();
    });

    // tab切换
    lu_element.on('tab(show_demo)', function(data){
        if(data.index == 1){
            var _SQL = $('#txtSql').val();
            $.post('./sql.ashx', { sql : _SQL }, function(result){
                if(result != ''){
                    var _data = JSON.parse(result).data;
                    
                    lu_table.render({
                        elem: '#data_demo',
                        data: eval(_data),
                        cellMinWidth: 150,
                        cols: [TABLE_COLUMNS]
                    });
                }
            });
        }
    });

    // 选择条件
    lu_form.on('select(condition_list)', function(data){
        $('#AddCondition').find('.layui-label-color-red').removeClass('layui-label-color-red');

        var column_type = $('#condition_list').find("option:selected").attr('column_type');
        if(column_type == 'string'){
            $('#txtKeyWord_like').parent().parent().find('label').addClass('layui-label-color-red');
            $('#txtKeyWord_in').parent().parent().find('label').addClass('layui-label-color-red');

            $('#txtKeyWord_like').attr('disabled',false);
            $('#txtKeyWord_in').attr('disabled',false);

            $('#inStart').attr('disabled',true);
            $('#inEnd').attr('disabled',true);
            $('#price_min').attr('disabled',true);
            $('#price_max').attr('disabled',true);
            $('input[name="bool_choose"]').attr('disabled',true);
        }
        else if(column_type == 'int'){
            $('#txtKeyWord_in').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('#txtKeyWord_in').attr('disabled',false);
            
            $('#txtKeyWord_like').attr('disabled',true);
            $('#inStart').attr('disabled',true);
            $('#inEnd').attr('disabled',true);
            $('#price_min').attr('disabled',true);
            $('#price_max').attr('disabled',true);
            $('input[name="bool_choose"]').attr('disabled',true);
        }
        else if(column_type == 'bool'){
            $('input[name="bool_choose"]').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('input[name="bool_choose"]').attr('disabled',false);

            $('#txtKeyWord_in').attr('disabled',true);
            $('#txtKeyWord_like').attr('disabled',true);
            $('#price_min').attr('disabled',true);
            $('#price_max').attr('disabled',true);
            $('#inStart').attr('disabled',true);
            $('#inEnd').attr('disabled',true);
        }
        else if(column_type == 'date' || column_type == 'datetime'){
            $('#inStart').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('#inStart').attr('disabled',false);
            $('#inEnd').attr('disabled',false);

            $('#txtKeyWord_in').attr('disabled',true);
            $('#txtKeyWord_like').attr('disabled',true);
            $('#price_min').attr('disabled',true);
            $('#price_max').attr('disabled',true);
            $('input[name="bool_choose"]').attr('disabled',true);
        }
        else if(column_type == 'double'){
            $('#price_min').parent().parent().find('label').addClass('layui-label-color-red');

            $('#price_min').attr('disabled',false);
            $('#price_max').attr('disabled',false);

            $('#txtKeyWord_like').attr('disabled',true);
            $('#txtKeyWord_in').attr('disabled',true);
            $('#inStart').attr('disabled',true);
            $('#inEnd').attr('disabled',true);
            $('input[name="bool_choose"]').attr('disabled',true);
        }
        else{
            lu_layer.msg('数据列类型错误');
        }

        lu_form.render();
    }); 

    lu_laydate.render({elem: '#inStart'});
    lu_laydate.render({elem: '#inEnd'});

    // 添加条件
    $('#btnAddContion').click(function(){
        var _obj = {};

        var column_type = $('#condition_list').find("option:selected").attr('column_type');
        var _field = $('#condition_list').val();
        var _field_tran = $('#condition_list').find("option:selected").text();

        if(_field == ''){
            lu_layer.msg('请选择条件列');
            return;
        }

        _obj.guid = Guid();
        _obj.field = _field;
        _obj.field_tran = _field_tran;
        _obj.column_type = column_type;

        if(column_type == 'string'){
            if($('#txtKeyWord_like').val() != '' && $('#txtKeyWord_in').val() != ''){
                lu_layer.msg('模糊关键字和精确关键字只能填一项');
                return;
            }

            if($('#txtKeyWord_like').val() != ''){
                _obj.stringtype = "like";
                _obj.keyword = $('#txtKeyWord_like').val();
            }
            else if($('#txtKeyWord_in').val() != ''){
                _obj.stringtype = "in";
                _obj.keyword = $('#txtKeyWord_in').val();
            }
        }
        else if(column_type == 'int'){
            _obj.keyword = $('#txtKeyWord_in').val();
        }
        else if(column_type == 'bool'){
            _obj.keyword = $('input[name="bool_choose"]:checked').val();
        }
        else if(column_type == 'date' || column_type == 'datetime'){
            _obj.left = $('#inStart').val();
            _obj.right = $('#inEnd').val();
        }
        else if(column_type == 'double'){
            _obj.left = $('#price_min').val();
            _obj.right = $('#price_max').val();
        }
        else{
            lu_layer.msg('数据列类型错误');
        }

        isExists = false;
        // 已存在，则替换
        for(i=0; i < CONDITIONS.length; i++){
            if(CONDITIONS[i].field == _field){
                CONDITIONS[i] = _obj;
                isExists = true;
                break;
            }
        }
        // 不存在，则添加
        if(!isExists){
            CONDITIONS.push(_obj);
        }

        var _temp_translate = TranslateConditions(_obj , 'translate');
        $('#con_list').append('<span class="layui-dc-circle" guid="' + _obj.guid + '">' + _temp_translate + '<i onclick="DeleteContion(\'' + _obj.guid + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');

        CreateSQL();
        lu_layer.closeAll();
    });
}

// 加载可选从表
function LessTableLoading(exists_table){
    var _select_table = exists_table;
    var _table_join = Enumerable.From(_t.datatables)
        .Where('$.table == "' + _select_table + '"')
        .Select('$.table_join')
        .ToArray();
    
    $.each(_table_join[0] , function(index , item){
        if($.inArray(item.table , LESS_TABLES) == -1){
            var _btn = $('#AddLessList').find('button[value="' + item.table + '"]');
            _btn.removeClass('layui-btn-disabled');
            _btn.attr('disabled',false);
            _btn.attr('fromjoin' , exists_table);
        }
    });
}

// 从表选择
function LessTableSelect(less_table, less_tablename){
    var _obj_join = {};
    _obj_join.tablename = less_table;
    _obj_join.jointablename = $('#AddLessList').find('button[value="' + less_table + '"]').attr('fromjoin');

    TABLE_COLUMNS = [];
    LESS_TABLES.push(less_table);
    LESS_TABLES_JOIN_RELATION.push(_obj_join);
    CreateSQL();
    CollectColumns();

    $('#less_list').append('<span class="layui-dc-circle" lesstable="' + less_table + '">' + less_tablename + '<i onclick="LessTableDelete(\'' + less_table + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');
    lu_layer.closeAll();
}

// 从表删除
function LessTableDelete(less_table){
    lu_layer.confirm('确定要删除此表么？', {
        btn: ['确定','取消']
    }, function(){
        TABLE_COLUMNS = [];
        JoinRelationDelete(less_table);
        // 删除表
        LESS_TABLES.splice($.inArray(less_table , LESS_TABLES) , 1);
        // 删除提示
        $('.layui-dc-circle[lesstable="' + less_table + '"]').remove();
        for(i = 0 ; i < LESS_TABLES_JOIN_RELATION.length ; i++)
        {
            if(LESS_TABLES_JOIN_RELATION[i].tablename == less_table){
                // 删除关联关系
                LESS_TABLES_JOIN_RELATION.splice(i, 1);
            }
        }

        // 重新生成SQL语句
        CreateSQL();
        CollectColumns();
        lu_layer.msg('删除成功', {icon: 1});

    }, function(){
        console.log('取消');
    });
}

// 删除迭代的关联关系
function JoinRelationDelete(less_table){
    // 找跟删除表关联的表，先删掉
    for(i = 0 ; i < LESS_TABLES_JOIN_RELATION.length ; i++)
    {
        if(LESS_TABLES_JOIN_RELATION[i].jointablename == less_table){
            var _tablename = LESS_TABLES_JOIN_RELATION[i].tablename;
            // 删除表
            LESS_TABLES.splice($.inArray(_tablename , LESS_TABLES) , 1);
            // 删除提示
            $('.layui-dc-circle[lesstable="' + _tablename + '"]').remove();
            // 删除关联关系
            LESS_TABLES_JOIN_RELATION.splice(i, 1);
            // 迭代删除
            JoinRelationDelete(_tablename);
        }
    }
}

// 删除条件
function DeleteContion(_guid){
    lu_layer.confirm('确定要删除此条件么？', {
        btn: ['确定','取消']
    }, function(){
        // 删除条件
        for(i=0; i < CONDITIONS.length; i++){
            if(CONDITIONS[i].guid == _guid){
                CONDITIONS.splice(i, 1);
            }
        }

        // 删除提示
        $('.layui-dc-circle[guid="' + _guid + '"]').remove();

        // 重新生成SQL语句
        CreateSQL();
        lu_layer.msg('删除成功', {icon: 1});
    }, function(){
        console.log('取消');
    });
}

// 生成SQL
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

    var _FIELD_ARR = [];
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

// 收集列的信息
function CollectColumns(){
    // 组装主表
    var _table = Enumerable.From(_t.datatables)
        .Where('$.table == "' + PRIMARY_TABLE + '"')
        .Select('$')
        .ToArray()[0];
    $.each(_table.table_columns , function(index , item){
        CreateTableColumn(item , PRIMARY_TABLE);
    });

    // 组装从表
    $.each(LESS_TABLES , function(index , item){
        var _less_table = Enumerable.From(_t.datatables)
            .Where('$.table == "' + item + '"')    
            .Select('$')
            .ToArray()[0];

        $.each(_less_table.table_columns , function(cIndex , cItem){
            CreateTableColumn(cItem , item);
        });
    });
}

// 创建预览表格的列
function CreateTableColumn(item , tablename){
    if(item.column_type == 'date')
        TABLE_COLUMNS.push({ 
            table: tablename ,
            field: item.column , 
            title: item.column_name , 
            type: item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + item.column + ')).format("YYYY-MM-DD")}}</span>'
        });
    else if(item.column_type == 'datetime')
        TABLE_COLUMNS.push({ 
            table: tablename ,
            field: item.column , 
            title: item.column_name , 
            type: item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + item.column + ')).format("YYYY-MM-DD hh:mm:ss")}}</span>'
        });
    else 
        TABLE_COLUMNS.push({ 
            table: tablename ,
            field: item.column , 
            title: item.column_name ,
            type: item.column_type
        });
}

// 弹出窗
function OpenLayer(_type , _content , _title , _width , _height){
    lu_layer.open({
        type: _type,
        content: _content,
        title: _title,
        area: [_width, _height]
    });
}

// 重置条件弹出窗
function ResetConditionLayer(){
    $('#AddCondition').find('.layui-label-color-red').removeClass('layui-label-color-red');

    $('#txtKeyWord_like').attr('disabled',true);
    $('#txtKeyWord_in').attr('disabled',true);
    $('#inStart').attr('disabled',true);
    $('#inEnd').attr('disabled',true);
    $('#price_min').attr('disabled',true);
    $('#price_max').attr('disabled',true);
    $('input[name="bool_choose"]').attr('disabled',true);

    $('#txtKeyWord_like').val('');
    $('#txtKeyWord_in').val('');
    $('#inStart').val('');
    $('#inEnd').val('');
    $('#price_min').val('');
    $('#price_max').val('');

    lu_form.render();
}

// 处理关键字特殊字符，去除空字符
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

// 解析及语义化查询条件
function TranslateConditions(item , type){
    var _temp_where = '';
    var _temp_translate = '';

    if(item.column_type == 'string'){
        var _keys = SpecialKeyWord(item.keyword);

        if(item.stringtype == 'in'){
            var _keys_char = Enumerable.From(_keys)
                .Select(function (x) { return "'" + x + "'" })
                .ToArray();

            _temp_where = item.field + ' in (' + _keys_char.join(',') + ')';
            _temp_translate = item.field_tran + TranTipAddClass('是') + _keys_char.join(',');
        }
        else if(item.stringtype == 'like'){
            var _keys_char = Enumerable.From(_keys)
                .Select(function (x) { return item.field + " like '%" + x + "%'" })
                .ToArray();

            _temp_where = '(' + _keys_char.join(' or ') + ')';
            _temp_translate = item.field_tran + TranTipAddClass('包含') + _keys.join(',');
        }
    }
    else if(item.column_type == 'int'){
        var _keys = SpecialKeyWord(item.keyword);
        _temp_where = item.field + ' in (' + _keys.join(',') + ')';
        _temp_translate = item.field_tran + TranTipAddClass('是') + _keys.join(',');
    }
    else if(item.column_type == 'bool'){
        _temp_where = item.field + " = '" + item.keyword + "'";
        _temp_translate = item.field_tran + TranTipAddClass('是') + item.keyword;
    }
    else if(item.column_type == 'date' || item.column_type == 'datetime'){
        if(item.left != '' && item.right != ''){
            _temp_where = item.field + " between '" + item.left + "' and '" + item.right + "'";
            _temp_translate = item.field_tran + TranTipAddClass('在') + item.left + TranTipAddClass('和') + item.right + TranTipAddClass('之间');
        }
        else if(item.left != ''){
            _temp_where = item.field + " >= '" + item.left + "'";
            _temp_translate = item.field_tran + TranTipAddClass('大于等于') + item.left;
        }
        else if(item.right != ''){
            _temp_where = item.field + " <= '" + item.right + "'";
            _temp_translate = item.field_tran + TranTipAddClass('小于等于') + item.left;
        }
    }
    else if(item.column_type == 'double'){
        if(item.left != '' && item.right != ''){
            _temp_where = item.field + ' between ' + item.left + ' and ' + item.right;
            _temp_translate = item.field_tran + TranTipAddClass('在') + item.left + TranTipAddClass('和') + item.right + TranTipAddClass('之间');
        }
        else if(item.left != ''){
            _temp_where = item.field + ' >= ' + item.left;
            _temp_translate = item.field_tran + TranTipAddClass('大于等于') + item.left;
        }
        else if(item.right != ''){
            _temp_where = item.field + ' <= ' + item.right;
            _temp_translate = item.field_tran + TranTipAddClass('小于等于') + item.left;
        }
    }

    if(type == 'where')
        return _temp_where;
    else
        return _temp_translate;
}

// 给条件转义的关键字加样式表，突出显示
function TranTipAddClass(key){
    return '<span class="condition-tip">' + key + '</span>';
}

// 生成Guid
function Guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
