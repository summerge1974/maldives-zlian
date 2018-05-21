#/bin/bash
#健康检查脚本,返回状态0为正常状态,非0为异常状态.容器初始化10秒后进行第一次健康检查,若不通过则停止部署.
#部署成功后,每10s进行一次健康检查,三次失败则容器自动重启

HTTPCODE=`curl -I --connect-timeout 2 -m 2 -o /dev/null -s -w %{http_code} http://localhost:8080/debug/health`
if [[ $HTTPCODE -eq 200 ]]; then
  exit 0
else
  exit 1
fi
