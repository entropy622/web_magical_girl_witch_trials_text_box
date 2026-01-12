# Web端的《魔法少女的魔女审判》的表情包生成器

## 使用地址 https://entropy622.github.io/web_magical_girl_witch_trials_text_box/

## 特别感谢
本项目的文本框基于
https://github.com/oplivilqo/Text_box-of-mahoushoujo_no_majosaiban
安安传话筒基于
https://github.com/MarkCup-Official/Anan-s-Sketchbook-Chat-Box
论破动画基于 <a href="https://space.bilibili.com/296330875/upload/video">东山燃灯寺</a> 老师的AE工程

## 项目简介
利用简洁清晰的界面来生成你的魔审表情包

![lunpo-1768231189355 (2)](https://github.com/user-attachments/assets/111ce66e-50a7-4df7-ac56-4c9938ca7a4f)
<img width="2163" height="1349" alt="image" src="https://github.com/user-attachments/assets/7ed0718a-5252-4dd0-a52c-267e2b419d72" />
![img.png](img/img.png)
![img_1.png](img/img_1.png)
![img.png](img/img_2.png)

### 功能
- 简洁的界面
- 全角色支持，多种差分
- 支持直接复制图片
- 移动端适配

## 本地运行 / 开发
### 技术栈
本项目是一个纯web项目，使用react+vite+tailwind+typescript开发。

使用github action 来进行自动化部署到github pages上。所有master上的commit都会自动部署到上面的使用地址

### 运行
clone本项目后
```
pnpm install
```
来安装依赖
```
pnpm dev
```
来启动项目。
默认端口是 http://localhost:5173/
```
pnpm build
```
来打包项目

## Contribute
如果你想交pr，请先fork然后交pr。
额外注意：本项目使用了eslint和prettier做格式化，请在交pr千前
```
eslint --fix
```
来格式化代码


## 其他
本项目使用以下命令将原素材转化为webp，大幅减少加载时间
```
Get-ChildItem -Recurse -Filter *.png | ForEach-Object {
    $input = $_.FullName
    $output = $_.FullName -replace '\.png$', '.webp'
    Write-Host "Converting: $input -> $output"
    ffmpeg -i "$input" -c:v libwebp -q:v 75 "$output" -hide_banner -loglevel error
}
```


