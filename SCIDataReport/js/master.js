/*--------------------------------------------------------------------------
* master.js - SQL语句生成工具的主体方法
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

$.getJSON('./SCIDataReport/SCIDataStructure.json', function (_source) {
    _t = _source;
    
    layui.use(['element', 'form', 'table', 'layer', 'laydate'], function () {
        lu_element = layui.element ,
        lu_form = layui.form ,
        lu_table = layui.table ,
        lu_layer = layui.layer ,
        lu_laydate = layui.laydate ;

        // 绑定主表
        $.each(_t.datatables , function(_index , item){
            $('#primary_list').append('<input type="radio" name="rd-primary" lay-filter="rd-primary" value="' + item.table + '" title="' + item.table_name + '" />');
        });
        lu_form.render();
        
        BindBaseEvent();
    });
});

/**
 * 绑定基础事件
 */
function BindBaseEvent(){
    // 使用帮助 -- 弹窗
    $('#btnHelp').click(function(){
        OpenLayer(1 , $('#useHelp') , '使用帮助' , '80%' , '80%');
    });

    // 保存查询 -- 弹窗
    $('#btnSave').click(function(){
        $('#txtTitle').val('');
        $('#txtRemark').val('');

        OpenLayer(1 , $('#SaveSql') , '保存查询' , '30%' , '30%');
    });

    // 保存查询
    $('#btnSaveSQL').click(function(){
        SaveSQL();
    });

    // 已保存的查询表选择事件
    lu_form.on('select(save_tables)', function(data){
        SaveTableLoading(data);
    });

    // 导出
    $('#btnImport').click(function(){
        lu_layer.prompt({
            formType: 0,
            title: '请输入接收邮箱',
            maxlength: 50
        }, function(value, index, elem){
            var _sql = CreateImportSQL();
            if(_sql == ''){
                lu_layer.msg('还没有设置需要导出的数据！');
            }
            else{
                $.post("api.ashx",{method: 'import' , email: value , sql: _sql},function(result){
                    lu_layer.msg(result);
                });
                lu_layer.close(index);
            }
        });
    });

    // 主表选择事件
    lu_form.on('radio(rd-primary)', function(data){
        ResetAll();
        PRIMARY_TABLE = data.value;
        CreateSQL();
        CollectColumns();
    });

    // 从表选择事件
    $('#btnAddLessList').click(function(){
        LessTable();
    });

    // 添加条件 - 弹窗
    $('#btnAddLayer').click(function(){
        ConditionInit();
    });

    // 添加条件的弹窗中，数据列的选择事件
    lu_form.on('select(condition_list)', function(data){
        ConditionSignSwitch();
    });

    // 添加条件的弹窗中，添加按钮的事件
    $('#btnAddCondition').click(function(){
        ConditionAdd();
    });

    // 自定义查询列 - 弹窗
    $('#btnChooseColumn').click(function(){
        ChooseColumnInit();
    });

    // 自定义查询列的弹窗中，表的选择事件
    lu_form.on('select(choose_columns_list)', function(data){
        ChooseColumnTableSelect(data);
    });

    // 自定义查询列的弹窗中，已选择的列添加拖动结束事件 -- drag-arrange.js 需自己绑定拖动结束事件
    $('#choose_columns_to').bind('drag.end.arrangeable',function(){
        SortSelectColumns();
    });

    // tab切换 - SQL 与 预览的切换
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
                        cols: [DATA_COLUMNS]
                    });
                }
            });
        }
    });

    // 初始化时间类型输入框
    lu_laydate.render({elem: '#inStart'});
    lu_laydate.render({elem: '#inEnd'});

    // 加载已保存的查询
    $('#save_tables').append('<option value="">直接选择或搜索选择</option>');    
    $.getJSON('/api.ashx' , {method: 'getlist'}, function(data){
        $.each(data , function(_index , item){
            $('#save_tables').append('<option value="' + item.id + '">' + item.title + '</option>');
        });
        lu_form.render('select');
    });
}

/**
 * 加载选择的已保存查询
 */
function SaveTableLoading(data){
    if(data.value != ''){
        lu_layer.confirm('确定要加载该查询么？此操作会覆盖已存在的操作！', {
            btn: ['确定','取消']
        }, function(){
            $.getJSON('/api.ashx', {method: 'get', sid: data.value}, function(exp){
                ResetAll();

                PRIMARY_TABLE = exp.primary ;
                LESS_TABLES = exp.less ;
                LESS_TABLES_JOIN_RELATION = exp.join ;
                CONDITIONS = exp.condition ;
                SELECT_COLUMNS = exp.selectcolumn ;
                TABLE_COLUMNS = exp.tablecolumn ;
                DATA_COLUMNS = exp.datacolumn ;

                CreateSQL();

                // 设置主表选中
                $('#primary_list').find('input[value="' + exp.primary + '"]').prop('checked' , true);
                lu_form.render();

                // 设置从表选中
                $.each(LESS_TABLES , function(_index , item){
                    $('#less_list').append('<span class="layui-dc-circle" lesstable="' + item + '">' + SearchTable(item).table_name + '<i onclick="LessTableDelete(\'' + item + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');
                });

                // 设置条件
                $.each(CONDITIONS , function(_index , item){
                    var _obj = item;
                    var _temp_translate = TranslateConditions(_obj , 'translate');
                    $('#con_list').append('<span class="layui-dc-circle" fromtable="' + _obj.from_table + '" guid="' + _obj.guid + '">' + _temp_translate + '<i onclick="DeleteContion(\'' + _obj.guid + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');
                });

                // 设置自定义列
                if(SELECT_COLUMNS.length > 0){
                    $.each(SELECT_COLUMNS , function(index , item){
                        var _obj = item;
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
                    });
                    DisabledSelectColumns();
                }

                lu_layer.closeAll();
            });
        }, function(){
            console.log('取消');
        });
    }
}
