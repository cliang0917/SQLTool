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
}