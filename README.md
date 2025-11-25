# Web端的《魔法少女的魔女审判》的文本框生成器

## 使用地址 https://entropy622.github.io/web_magical_girl_witch_trials_text_box/

## 特别感谢
本项目基于
https://github.com/oplivilqo/Text_box-of-mahoushoujo_no_majosaiban

## 项目简介
利用简洁清晰的界面来生成你的文本框
![img.png](img/img.png)
![img_1.png](img/img_1.png)

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
