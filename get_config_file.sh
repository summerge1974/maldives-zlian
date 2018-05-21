#/bin/bash
#以下产品组各自新增所需的配置文件,已在远端由配置中心生成,直接拉取到本地
Project_name=maldives

source /etc/profile

cd ~/config

rm -rf .env

wget http://ci.downtown8.cn:10888/nightly/$env/$Project_name/config/.env
