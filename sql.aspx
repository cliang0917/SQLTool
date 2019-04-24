<%@ Page Language="C#" AutoEventWireup="true" CodeFile="sql.aspx.cs" Inherits="sql" %>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head runat="server">
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <title>SQL语句生成工具</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
        <link href="./layui/css/layui.css" rel="stylesheet" />
        <link href="./layui/css/admin.css" rel="stylesheet" />
        <style type="text/css">
            html {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <form id="form1" runat="server">
            <div class="layui-fluid layui-form">
                <div class="layui-row" style="background-color: #fff;padding: 10px;">
                    <div class="layui-form-item">
                        <label class="layui-form-label"></label>
                        <div class="layui-input-block">
                            <button type="button" class="layui-btn layui-btn-normal" id="btnHelp">
                                使用前先点我看使用帮助 <i class="layui-icon">&#xe60b;</i>
                            </button>
                            <button type="button" class="layui-btn layui-btn-normal" id="btnLog">
                                更新日志 <i class="layui-icon">&#xe60c;</i>
                            </button>
                        </div>
                    </div>
                    <div class="layui-form-item">
                        <label class="layui-form-label"><b>主表</b></label>
                        <div class="layui-input-block" id="primary_list"></div>
                    </div>
                    <div class="layui-form-item">
                        <label class="layui-form-label"><b>从表</b></label>
                        <div class="layui-input-block" id="less_list"></div>
                    </div>
                    <div class="layui-form-item" id="con_list">
                        <label class="layui-form-label"><b>条件</b></label>
                        <div class="layui-inline">
                            <button type="button" class="layui-btn layui-btn-sm layui-btn-primary" id="btnAddLayer">
                                <i class="layui-icon">&#xe654;</i>
                            </button>
                        </div>
                    </div>
                    <div class="layui-form-item layui-form-text">
                        <label class="layui-form-label"><b>SQL</b></label>
                        <div class="layui-input-block">
                            <div class="layui-tab layui-tab-card" lay-filter="show_demo">
                                <ul class="layui-tab-title">
                                    <li class="layui-this">SQL</li>
                                    <li>预览</li>
                                </ul>
                                <div class="layui-tab-content" style="height: 490px;">
                                    <div class="layui-tab-item layui-show">
                                        <textarea id="txtSql" name="txtSql" class="layui-textarea" disabled style="height:380px;"></textarea>
                                    </div>
                                    <div class="layui-tab-item">
                                        <table id="data_demo" lay-filter="data_demo"></table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 添加条件弹窗 START -->
            <div class="layui-form" id="AddCondition" style="padding: 10px;display: none;">
                <div class="layui-form-item">
                    <label class="layui-form-label"><b>选择条件列</b></label>
                    <div class="layui-input-block">
                        <select id="condition_list" lay-filter="condition_list" lay-verify="" lay-search></select>
                    </div>
                </div>
                <div class="layui-form-item">
                    <label class="layui-form-label"><b>模糊关键字</b></label>
                    <div class="layui-input-block">
                        <textarea id="txtKeyWord_like" name="txtKeyWord_like" class="layui-textarea" disabled placeholder="此处关键字为模糊查询，多个关键字请用英文逗号隔开" style="height:80px;"></textarea>
                    </div>
                </div>
                <div class="layui-form-item">
                    <label class="layui-form-label"><b>精确关键字</b></label>
                    <div class="layui-input-block">
                        <textarea id="txtKeyWord_in" name="txtKeyWord_in" class="layui-textarea" disabled placeholder="此处关键字为精确查询，多个关键字请用英文逗号隔开" style="height:80px;"></textarea>
                    </div>
                </div>
                <div class="layui-form-item">
                    <div class="layui-inline">
                        <label class="layui-form-label"><b>时间范围</b></label>
                        <div class="layui-input-inline" style="width: 140px;">
                            <input type="text" class="layui-input date-range" id="inStart" disabled placeholder="开始日期">
                        </div>
                        <div class="layui-form-mid">-</div>
                        <div class="layui-input-inline" style="width: 140px;">
                            <input type="text" class="layui-input date-range" id="inEnd" disabled placeholder="截止日期">
                        </div>
                    </div>
                </div>
                <div class="layui-form-item">
                    <div class="layui-inline">
                        <label class="layui-form-label"><b>金额范围</b></label>
                        <div class="layui-input-inline" style="width: 140px;">
                            <input type="text" id="price_min" placeholder="￥" disabled class="layui-input">
                        </div>
                        <div class="layui-form-mid">-</div>
                        <div class="layui-input-inline" style="width: 140px;">
                            <input type="text" id="price_max" placeholder="￥" disabled class="layui-input">
                        </div>
                    </div>
                </div>
                <div class="layui-form-item">
                    <div class="layui-inline">
                        <label class="layui-form-label"><b>布尔选择</b></label>
                        <div class="layui-input-block">
                            <input type="radio" name="bool_choose" value="1" title="是" />
                            <input type="radio" name="bool_choose" value="0" title="否" />
                        </div>
                    </div>
                </div>
                <div class="layui-form-item" style="text-align: center;">
                    <button type="button" class="layui-btn layui-btn-normal" id="btnAddContion">添加条件</button>
                </div>
            </div>
            <!-- 添加条件弹窗 END -->

            <!-- 使用帮助 START -->
            <div id="useHelp" style="padding: 10px;display: none;line-height: 30px;">
                <h3>一、主表</h3>
                <h4>主表为要查询的主数据，一般为表格中对应的列最多的表</h4>
                <h4>主表每次只能选一个</h4>
                <br />
                <h3>二、从表</h3>
                <h4>当选择主表后，会按照选择的主表，自动启用可关联查询的其他表，即从表</h4>
                <h4>从表每次可以选多个</h4>
                <br />
                <h3>三、条件</h3>
                <h4>当主从表选择完毕后，可以添加筛选条件，目前实现了4种筛选</h4>
                <h4>1、多关键字模糊查询</h4>
                <h4 style="text-indent: 14px;">多关键字用逗号（中文或英文均可，其他符号无效）隔开后，直接粘贴至文本框内，自动检测关键字。模糊查询，即包含该关键字的数据可查出。</h4>
                <h4>2、多关键字精确查询</h4>
                <h4 style="text-indent: 14px;">多关键字用逗号（中文或英文均可，其他符号无效）隔开后，直接粘贴至文本框内，自动检测关键字。精确查询，即所选列为该关键字的数据可查出。</h4>
                <h4>3、日期区间查询</h4>
                <h4 style="text-indent: 14px;">左右都填时，查询在两个时间范围内的数据；只填左侧日期时，查询大于等于该日期的数据；只填右侧日期时，查询小于等于该日期的数据。</h4>
                <h4>4、金额区间查询</h4>
                <h4 style="text-indent: 14px;">左右都填时，查询在两个金额范围内的数据；只填左侧金额时，查询大于等于该金额的数据；只填右侧金额时，查询小于等于该金额的数据。</h4>
                <h4>5、布尔选择</h4>
                <h4 style="text-indent: 14px;">即只能选是或者否。</h4>
                <h4 style="font-weight: bold;color: red;">Tip：</h4>
                <h4 style="font-weight: bold;color: red;">当选择了条件列后，标签变为红色的为当前选中列可以设置的条件。如果同时有多个变为红色，请选填其中一个，不支持同一列的多条件处理。</h4>
                <h4 style="font-weight: bold;color: red;">已添加为条件的列，不可再次选择。</h4>
                <h4 style="font-weight: bold;color: red;">已添加为条件的列，可以删除该列对应的条件，然后再次选择。</h4>
                <br />
                <h3>四、SQL</h3>
                <h4>SQL标签为生成的SQL语句</h4>
                <h4>预览标签为SQL语句查询的数据的预览，只调取前10条。<span style="color: red ;font-weight: bold;">当SQL语句发生变化时，需重新切换一次，方可正确预览数据。</span></h4>
            </div>
            <!-- 使用帮助 END -->

            <!-- 更新日志 START -->
            <div id="updateLog" style="padding: 10px;display: none;">
                <ul class="layui-timeline">
                    <li class="layui-timeline-item">
                        <i class="layui-icon layui-timeline-axis">&#xe63f;</i>
                        <div class="layui-timeline-content layui-text">
                            <h3 class="layui-timeline-title">2019年4月21日</h3>
                            <p>
                                实现主从与从表的绑定<br />
                                实现从表跟随主表的联动<br />
                                实现SQL语句中的 select * from
                            </p>
                        </div>
                    </li>
                    <li class="layui-timeline-item">
                        <hr />
                    </li>
                    <li class="layui-timeline-item">
                        <i class="layui-icon layui-timeline-axis">&#xe63f;</i>
                        <div class="layui-timeline-content layui-text">
                            <h3 class="layui-timeline-title">2018年12月28日</h3>
                            <p>
                                优化预览数据加载<br />
                                优化筛选条件，从表取消选中时，同时删除相应从表的已添加条件<br />
                                新增Boolean类型的筛选条件<br />
                                修复字符串类型关键字过多时条件无法删除的BUG，目前最多保留100个字符<br />
                                新增默认条件，如查询订单信息时，默认查询已到账且到账时间在2018年的数据
                            </p>
                        </div>
                    </li>
                    <li class="layui-timeline-item">
                        <i class="layui-icon layui-timeline-axis">&#xe63f;</i>
                        <div class="layui-timeline-content layui-text">
                            <h3 class="layui-timeline-title">2018年12月27日</h3>
                            <p>
                                实现SQL预计中的 IN 查询<br />
                                实现SQL语句中的范围（Range）查询<br />
                                实现数据预览
                            </p>
                        </div>
                    </li>
                    <li class="layui-timeline-item">
                        <i class="layui-icon layui-timeline-axis">&#xe63f;</i>
                        <div class="layui-timeline-content layui-text">
                            <h3 class="layui-timeline-title">2018年12月26日</h3>
                            <p>
                                实现SQL预计中的 inner join<br />
                                实现批量粘贴的关键字的自动检；<br />
                                实现SQL语句中的 模糊查询 ，使用 contains 关键字
                            </p>
                        </div>
                    </li>
                </ul>
            </div>
            <!-- 更新日志 END -->

        </form>
        <script src="./js/jquery-3.3.1.min.js"></script>
        <script src="./js/linq.js"></script>
        <script src="./js/moment.min.js"></script>
        <script src="./layui/layui.js"></script>
        <script src="./SCIDataReport/SCIDataReport.js"></script>
    </body>
</html>