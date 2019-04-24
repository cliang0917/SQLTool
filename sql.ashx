<%@ WebHandler Language="C#" Class="sql" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using MathBasic.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

public class sql : IHttpHandler
{
    private SqlDataBase db = new SqlDataBase("CRMDataConnectionString", false);

    public void ProcessRequest(HttpContext context)
    {
        string _result = "";
        string sql = context.Request.Form["sql"].ToString();
        if (!string.IsNullOrWhiteSpace(sql))
        {
            DataTable dt = db.CreateDataSet(sql).Tables[0];

            DataEntity de = new DataEntity()
            {
                data = dt
            };
            _result = JsonConvert.SerializeObject(de);
        }

        context.Response.ContentType = "text/plain";
        context.Response.Write(_result);
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }


    public class DataEntity
    {
        public int code { get; set; }
        public string msg { get; set; }
        public int count { get; set; }
        public DataTable data { get; set; }
    }
}