/*--------------------------------------------------------------------------
* condition.js - SQL语句生成工具中查询条件的相关处理
* 
* created and maintained by chen liang
*--------------------------------------------------------------------------*/

/**
 * 添加条件弹窗内容初始化
 */
function ConditionInit(){
    if(PRIMARY_TABLE == ''){
        lu_layer.msg('至少选择一个表!');
        return;
    }
    
    ResetConditionLayer();
    ConditionColumnBind();

    OpenLayer(1 , $('#AddCondition') , '添加条件' , '60%' , '80%');
}

/**
 * 查询条件标记切换，这里主要是限制不同类型填写或者选择不同的条件
 */
function ConditionSignSwitch(){
    $('#AddCondition').find('.layui-label-color-red').removeClass('layui-label-color-red');

    var column_type = $('#condition_list').find("option:selected").attr('column_type');
    var arr_index = [];
    if(column_type == 'string')
        arr_index = [0 , 1];
    else if(column_type == 'int')
        arr_index = [1];
    else if(column_type == 'bool')
        arr_index = [6 , 7];
    else if(column_type == 'date' || column_type == 'datetime')
        arr_index = [2 , 3];
    else if(column_type == 'double')
        arr_index = [4 , 5];
    else
        lu_layer.msg('数据列类型错误');

    SignSwitch(arr_index);
    lu_form.render();
}

/**
 * 实现切换
 * @param {array} _indexs - 需要切换的项的索引，是个数组
 */
function SignSwitch(_indexs){
    $.each($('#AddCondition').find('*[f="f"]'), function(_index , _item){
        if($.inArray(_index , _indexs) > -1){
            $(this).parent().parent().find('label').addClass('layui-label-color-red');
            $(this).attr('disabled',false);
        }
        else{
            $(this).attr('disabled',true);
        }
    });
}

/**
 * 添加条件
 */
function ConditionAdd(){
    var _field = $('#condition_list').val();

    if(_field == ''){
        lu_layer.msg('请选择条件列');
        return;
    }

    // 获取选择列的信息
    var _select_option = $('#condition_list').find("option:selected");
    var _field_tran = _select_option.text();
    var _column_type = _select_option.attr('column_type');
    var _from_table = _select_option.attr('fromtable');

    // 组合对象
    var _obj = {};
    _obj.guid = Guid();
    _obj.field = _field;
    _obj.field_tran = _field_tran;
    _obj.column_type = _column_type;
    _obj.from_table = _from_table;

    if(_column_type == 'string'){
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
    else if(_column_type == 'int'){
        _obj.keyword = $('#txtKeyWord_in').val();
    }
    else if(_column_type == 'bool'){
        _obj.keyword = $('input[name="bool_choose"]:checked').val();
    }
    else if(_column_type == 'date' || _column_type == 'datetime'){
        _obj.left = $('#inStart').val();
        _obj.right = $('#inEnd').val();
    }
    else if(_column_type == 'double'){
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
    $('#con_list').append('<span class="layui-dc-circle" fromtable="' + _obj.from_table + '" guid="' + _obj.guid + '">' + _temp_translate + '<i onclick="DeleteContion(\'' + _obj.guid + '\');" title="删除" class="layui-icon">&#x1006;</i></span>');

    CreateSQL();
    lu_layer.closeAll();
}

/**
 * 删除条件
 * @param {string} _guid - 唯一标识
 */
function DeleteContion(_guid){
    lu_layer.confirm('确定要删除此条件么？', {
        btn: ['确定','取消']
    }, function(){
        // 删除条件
        for(let i = 0; i < CONDITIONS.length; i++){
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

/**
 * 重置条件弹出窗，并全部禁用
 */
function ResetConditionLayer(){
    $('#AddCondition').find('.layui-label-color-red').removeClass('layui-label-color-red');
    $.each($('#AddCondition').find('*[f="f"]'), function(_index , _item){
        $(this).attr('disabled',true);

        if($(this).attr('type') != 'radio')
            $(this).val('');
    });
    lu_form.render();
}

/**
 * 绑定查询条件列
 */
function ConditionColumnBind(){
    // 绑定列
    $('#condition_list').empty();
    $('#condition_list').append('<option value="">直接选择或搜索选择</option>');

    $.each(TABLE_COLUMNS , function(_index , item){
        var _value = item.table + '.' + item.field;
        var _disabled = '';
        $.each(CONDITIONS , function(_conIndex , conItem){
            if(conItem.field == _value){
                _disabled = 'disabled';
            }
        });
        
        $('#condition_list').append('<option value="' + _value + '" fromtable="' + item.table + '" column_type="' + item.type + '" ' + _disabled + '>' + item.tablename + '的' + item.title + '</option>');
    });
    lu_form.render('select');
}

/**
 * 按表删除条件
 * @param {string} _tablename - 要删除查询条件的表名（英文）
 */
function DeleteContionByTable(_tablename){
    // 删除条件
    for(let i = CONDITIONS.length - 1; i >=0 ; i--){
        if(CONDITIONS[i].from_table == _tablename){
            CONDITIONS.splice(i, 1);
        }
    }
    
    // 删除提示
    $('.layui-dc-circle[fromtable="' + _tablename + '"]').remove();
}

/**
 * 解析及语义化查询条件
 * @param {object} _item -- 选择列的对象
 * @param {string} _type -- 解析什么类型，SQL还是语义
 */
function TranslateConditions(_item , _type){
    var _temp_where = '';
    var _temp_translate = '';

    if(_item.column_type == 'string'){
        var _keys = SpecialKeyWord(_item.keyword);

        if(_item.stringtype == 'in'){
            var _keys_char = Enumerable.From(_keys)
                .Select(function (x) { return "'" + x + "'" })
                .ToArray();

            _temp_where = _item.field + ' in (' + _keys_char.join(',') + ')';
            _temp_translate = _item.field_tran + TranTipAddClass('是') + _keys_char.join(',');
        }
        else if(_item.stringtype == 'like'){
            var _keys_char = Enumerable.From(_keys)
                .Select(function (x) { return _item.field + " like '%" + x + "%'" })
                .ToArray();

            _temp_where = '(' + _keys_char.join(' or ') + ')';
            _temp_translate = _item.field_tran + TranTipAddClass('包含') + _keys.join(',');
        }
    }
    else if(_item.column_type == 'int'){
        var _keys = SpecialKeyWord(_item.keyword);
        _temp_where = _item.field + ' in (' + _keys.join(',') + ')';
        _temp_translate = _item.field_tran + TranTipAddClass('是') + _keys.join(',');
    }
    else if(_item.column_type == 'bool'){
        _temp_where = _item.field + " = '" + _item.keyword + "'";
        _temp_translate = _item.field_tran + TranTipAddClass('是') + _item.keyword;
    }
    else if(_item.column_type == 'date' || _item.column_type == 'datetime'){
        if(_item.left != '' && _item.right != ''){
            _temp_where = _item.field + " between '" + _item.left + "' and '" + _item.right + "'";
            _temp_translate = _item.field_tran + TranTipAddClass('在') + _item.left + TranTipAddClass('和') + _item.right + TranTipAddClass('之间');
        }
        else if(_item.left != ''){
            _temp_where = _item.field + " >= '" + _item.left + "'";
            _temp_translate = _item.field_tran + TranTipAddClass('大于等于') + _item.left;
        }
        else if(_item.right != ''){
            _temp_where = _item.field + " <= '" + _item.right + "'";
            _temp_translate = _item.field_tran + TranTipAddClass('小于等于') + _item.left;
        }
    }
    else if(_item.column_type == 'double'){
        if(_item.left != '' && _item.right != ''){
            _temp_where = _item.field + ' between ' + _item.left + ' and ' + _item.right;
            _temp_translate = _item.field_tran + TranTipAddClass('在') + _item.left + TranTipAddClass('和') + _item.right + TranTipAddClass('之间');
        }
        else if(_item.left != ''){
            _temp_where = _item.field + ' >= ' + _item.left;
            _temp_translate = _item.field_tran + TranTipAddClass('大于等于') + _item.left;
        }
        else if(_item.right != ''){
            _temp_where = _item.field + ' <= ' + _item.right;
            _temp_translate = _item.field_tran + TranTipAddClass('小于等于') + _item.left;
        }
    }

    if(_type == 'where')
        return _temp_where;
    else
        return _temp_translate;
}