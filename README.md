### 服务描述

ipp虚拟打印服务，提供打印机服务。终端配置安装打印机后，可能打印生成的作业文件进行拦截。

### 主要功能

1. 启动一个ipp协议虚拟打印机
2. 接收用户通过通用本地的通用PCL/Postscript打印驱动生成的打印文件（pcl/ps格式）
3. 生成打印任务文件打印内容文件（pcl/ps）


### 打印机配置安装

- MACOS操作系统配置脚本：

``` bash
sh docs/macos_printer.sh xxxx
```

- Windows操作系统配置脚本：

``` 
.\windows_printer.bat
```

> 管理员权限执行下面脚本
