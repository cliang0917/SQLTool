# SQLTool

SQL语句生成工具

2019-05-22  
1.修复BUG  
2.实现条件语句

2019-05-24  
1、修复BUG  
2、实现条件的语义翻译及展示

2019-05-27  
1、实现查询条件的展示及删除  
2、添加条件弹窗中的列列名增加限制，已添加条件的列，不可重复添加，除非删掉原条件  

下一阶段目标：  
1、梳理、整理代码、优化  
2、实现group by 、 order by 、 having 等  
3、实现结果集二次处理及查询

2019-06-04 
1、修复BUG  
2、实现从表迭代关联，如主表A和从表B可以关联，而从表B和从表C可以关联，从表C和从表D可以关联  
3、实现从表级联删除，如上示例，删除从表B时，从表C和D会自动删除，避免生成的SQL语句执行出错
