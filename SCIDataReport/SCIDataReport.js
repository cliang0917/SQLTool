var _t; // 数据源
var lu_element , lu_form , lu_table , lu_layer , lu_laydate; // LayUI 相关组件
var PRIMARY_TABLE; // 主表
var LESS_TABLES = []; // 从表
var CONDITIONs = []; // 条件
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
        $('#less_list').append('<input type="checkbox" lay-skin="primary" lay-filter="ck-less" value="' + item.table + '" title="' + item.table_name + '" disabled="" />');
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

    // 添加条件
    $('#btnAddLayer').click(function(){
        // 绑定列
        $('#condition_list').empty();
        $('#condition_list').append('<option value="">直接选择或搜索选择</option>');
        $.each(TABLE_COLUMNS , function(index , item){
            $('#condition_list').append('<option value="' + item.field + '" column_type="' + item.type + '">' + item.title + '</option>');
        });
        lu_form.render('select');

        OpenLayer(1 , $('#AddCondition') , '添加条件' , '60%' , '80%');
    });

    // 主表选择事件
    lu_form.on('radio(rd-primary)', function(data){
        //重置
        LESS_TABLES = [];
        CONDITIONs = [];
        TABLE_COLUMNS = [];

        // 先全部禁用和取消选中
        $('#less_list').find('input:checkbox').each(function(index , item){
            item.checked = false;
            item.disabled = true;
        });
        lu_form.render('checkbox');

        // 找到可以关联的表，并启用
        var _select_table = data.value;
        var _table_join = Enumerable.From(_t.datatables)
            .Where('$.table == "' + _select_table + '"')    
            .Select('$.table_join')
            .ToArray();
        
        $.each(_table_join[0] , function(index , item){
            $('#less_list').find('input:checkbox[value="' + item.table + '"]').attr("disabled",false);
        });
        lu_form.render('checkbox');

        // 生成SQL
        PRIMARY_TABLE = data.value;
        CreateSQL();
    });
    
    // 从表选中事件
    lu_form.on('checkbox(ck-less)', function(data){
        TABLE_COLUMNS = [];

        if(data.elem.checked)
            LESS_TABLES.push(data.value);
        else
            LESS_TABLES.splice($.inArray(data.value , LESS_TABLES) , 1);

        CreateSQL();
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

            $('#txtKeyWord_like').attr("disabled",false);
            $('#txtKeyWord_in').attr("disabled",false);

            $('#inStart').attr("disabled",true);
            $('#inEnd').attr("disabled",true);
            $('#price_min').attr("disabled",true);
            $('#price_max').attr("disabled",true);
            $('input[name="bool_choose"]').attr("disabled",true);
        }
        else if(column_type == 'int'){
            $('#txtKeyWord_in').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('#txtKeyWord_in').attr("disabled",false);
            
            $('#txtKeyWord_like').attr("disabled",true);
            $('#inStart').attr("disabled",true);
            $('#inEnd').attr("disabled",true);
            $('#price_min').attr("disabled",true);
            $('#price_max').attr("disabled",true);
            $('input[name="bool_choose"]').attr("disabled",true);
        }
        else if(column_type == 'bool'){
            $('input[name="bool_choose"]').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('input[name="bool_choose"]').attr("disabled",false);

            $('#txtKeyWord_in').attr("disabled",true);            
            $('#txtKeyWord_like').attr("disabled",true);            
            $('#price_min').attr("disabled",true);
            $('#price_max').attr("disabled",true);
            $('#inStart').attr("disabled",true);
            $('#inEnd').attr("disabled",true);
        }
        else if(column_type == 'date' || column_type == 'datetime'){
            $('#inStart').parent().parent().find('label').addClass('layui-label-color-red');
            
            $('#inStart').attr("disabled",false);
            $('#inEnd').attr("disabled",false);

            $('#txtKeyWord_in').attr("disabled",true);            
            $('#txtKeyWord_like').attr("disabled",true);            
            $('#price_min').attr("disabled",true);
            $('#price_max').attr("disabled",true);
            $('input[name="bool_choose"]').attr("disabled",true);
        }
        else if(column_type == 'double'){
            $('#price_min').parent().parent().find('label').addClass('layui-label-color-red');

            $('#price_min').attr("disabled",false);
            $('#price_max').attr("disabled",false);

            $('#txtKeyWord_like').attr("disabled",true);
            $('#txtKeyWord_in').attr("disabled",true);
            $('#inStart').attr("disabled",true);
            $('#inEnd').attr("disabled",true);
            $('input[name="bool_choose"]').attr("disabled",true);
        }
        else{
            lu_layer.msg('数据列类型错误！');
        }

        lu_form.render();
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
        CreateTableColumn(item);
    });
    // 找从表的列
    $.each(LESS_TABLES , function(index , item){
        var _less_table = Enumerable.From(_t.datatables)
            .Where('$.table == "' + item + '"')    
            .Select('$')
            .ToArray()[0];

        $.each(_less_table.table_columns , function(cIndex , cItem){
            _FIELD_ARR.push('    ' + item + '.' + cItem.column);
            CreateTableColumn(cItem);
        });
    });

    _FIELD = _FIELD_ARR.join(',\r\n');

    _FROM = 'from ' + PRIMARY_TABLE;

    $.each(_table.table_join , function(index , item){
        var f = $.inArray(item.table , LESS_TABLES);
        if(f > -1)
            _INNER += 'inner join ' + item.table + ' on ' + item.table + '.' + item.primary_key + ' = ' + PRIMARY_TABLE + '.' + item.foreign_key + '\r\n';
    });

    var _SQL = _SELECT + '\r\n' + _FIELD  + '\r\n'+ _FROM + '\r\n' + _INNER + _WHERE + '\r\n';
    $('#txtSql').val(_SQL);
}

// 创建预览表格的列
function CreateTableColumn(item){
    if(item.column_type == 'date')
        TABLE_COLUMNS.push({ 
            field: item.column , 
            title: item.column_name , 
            type: item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + item.column + ')).format("YYYY-MM-DD")}}</span>'
        });
    else if(item.column_type == 'datetime')
        TABLE_COLUMNS.push({ 
            field: item.column , 
            title: item.column_name , 
            type: item.column_type ,
            templet: '<span>{{ moment(new Date(d.' + item.column + ')).format("YYYY-MM-DD hh:mm:ss")}}</span>'
        });
    else 
        TABLE_COLUMNS.push({ 
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