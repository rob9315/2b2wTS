declare -A OSInfo
OSInfo[/etc/redhat-release]="yum install"
OSInfo[/etc/arch-release]="pacman -S"
OSInfo[/etc/gentoo-release]="emerge install"
OSInfo[/etc/debian-version]="apt-get install"
OSInfo[/etc/alpine-release]="apk add"

for f in ${!OSInfo[@]}
do
    if [[ -f $f ]];then
        ${OSInfo[$f]} git npm
    fi
done

git clone https://github.com/rob9315/2b2wTS
cd 2b2wTS
npm install
npm start