# axion-release-node-plugin
A nodejs plug-in (mimicking the Gradle plug-in: axion-release-plugin) is used for the package management of Web.



### 描述

该插件基于node（version 8），用于前端组件开发的CI。

如果是个人的组件开发的持续集成，建议使用“[semantic-release-gitlab](https://gitlab.com/hutson/semantic-release-gitlab)”或“[semantic-release](https://github.com/semantic-release/semantic-release)”。

当前插件模式模仿gradle的持续集成插件“axion-release-plugin”的模式，将前端组件包的版本控制集中在git的管理上。

- 首先，你需要保证你插件的git仓库提交遵循 “[semantic version](https://semver.org/lang/zh-CN/)”规范，默认规范为“[Angular Contributing Guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md#type)”。
- 其次，你的package不需要再配置version，版本号的生成由插件来负责。
- 然后，你需要在你的pipeline脚本最后的stage加上"axion-release"命令，它会帮助你计算当前组件的版本，且修改*package.json*文件中的version后发布（当前，你需要先配置一些环境变量用于发布的认证）。


那么，如何区分组件的测试版本和正式版本？



#### 环境变量



#### 版本规则

语义版本规则参照：[shifted-semver-increment](https://gitlab.com/hyper-expanse/open-source/shifted-semver-increment#readme)。

检查当前仓储的最后一次行为（git log）：

- 如果没有tag，版本从0.1.0-SNAPSHOT开始
- 如果有tag，但最新的commit不是tag，则根据语义规范发布相应版本的SNAPSHOT版本
- 如果有tag，且最新的commit是tag，则根据tag发布







### 安装&使用

#### Install

`npm i axion-release-node-plugin`

#### Use

在更新当前本地git仓库后，

- 如果是全局安装 ，project根目录执行：`axion-release`。
- 如果是project本地安装`./node_modules/.bin/axion-release`。



