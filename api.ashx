<%@ WebHandler Language="C#" Class="api" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using MathBasic.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using RabbitMQ.Client;
using System.Text;

public class api : IHttpHandler {

    private SqlDataBase db = new SqlDataBase("CRMDataConnectionString", false);

    public void ProcessRequest(HttpContext context)
    {
        string result = string.Empty;
        string method = context.Request["method"].ToString();
        switch (method) {
            case "getlist":
                string sqlList = string.Format("select id , title from UserDefined");
                DataTable dtList = db.CreateDataSet(sqlList).Tables[0];
                result = JsonConvert.SerializeObject(dtList);
                break;
            case "get":
                string sid = context.Request["sid"].ToString();
                string sqlExp = string.Format("select Expression from UserDefined where id = '{0}'" , sid);
                result = db.ReadValue(sqlExp, "Expression").ToString();
                break;
            case "save":
                string title = context.Request["title"].ToString();
                string remark = context.Request["remark"].ToString();
                string sql = context.Request["sql"].ToString();
                string excute = string.Format("insert into UserDefined (Title , Remark , Expression) values ('{0}' , '{1}' , '{2}')" , title , remark , sql);
                int n = db.ExecCommand(excute);
                result = (n == 1 ? "1" : "0");
                break;
            case "import":
                ImportEntity ie = new ImportEntity() {
                    email = context.Request["email"].ToString(),
                    sql = context.Request["sql"].ToString()
                };
                PushImport(JsonConvert.SerializeObject(ie), "ex_data_import", "r_data_import", "q_data_import");
                result = "1";
                break;
        }

        context.Response.ContentType = "text/plain";
        context.Response.Write(result);
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

    private void PushImport(string msg, string exchange, string routingKey, string QueueName) {
        ConnectionFactory factory = new ConnectionFactory();
        factory.Uri = ApolloHelper.CONNECTION_SEETINGS.MQ_CMS;

        using (var conn = factory.CreateConnection())
        {
            using (var channel = conn.CreateModel())
            {
                channel.ExchangeDeclare(exchange, "direct", true);
                channel.QueueDeclare(QueueName, true, false, false, null);
                channel.QueueBind(QueueName, exchange, routingKey);
                var body = Encoding.UTF8.GetBytes(msg);
                channel.BasicPublish(exchange, routingKey, null, body);
            }
        }
    }

    public class ImportEntity {
        public string email { get; set; }
        public string sql { get; set; }
    }
}