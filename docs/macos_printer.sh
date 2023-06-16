if [ $# -eq 0 ]; then
    userId="userid"
else
    userId=$1
fi

host="http://127.0.0.1:8899/ipp/"

driverType="ps"
params=$(printf $userId-$driverType | base64)
url=$host$params
echo $url
# DuplexNoTumble: 长边打印 DuplexTumble: 短边打印
lpadmin -p "CloudPrinterPS" -E -L "Local" -o Option1=true -o Duplex=DuplexNoTumble -D "[dev]Printer(彩色)" -v $url -m drv:///sample.drv/generic.ppd
echo "Add ps printer success."

driverType="pcl"
params=$(printf $userId-$driverType | base64)
url=$host$params
echo $url
lpadmin -p "CloudPrinterPCL" -E -L "Local" -o Option1=true -o Duplex=DuplexNoTumble -D "[dev]Printer(黑白)" -v $url -m drv:///sample.drv/generpcl.ppd
echo "Add ps printer success."
