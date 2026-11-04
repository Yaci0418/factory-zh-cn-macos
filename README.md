# Factory Desktop 简体中文补丁 · macOS

**v1.0.1 修正版**。原适配目标为 Factory Desktop 1.2.0；本次在 **1.3.0 / Apple Silicon（arm64）** 的独立副本上完成安装、重复安装、恢复及实际签名校验。Intel Mac 尚未验证。

这是修改本机 Factory.app 的汉化工具，**不是可导入的插件**。包内已包含构建文件，普通用户无需安装 npm 依赖。

> 安装会替换官方代码签名为 ad-hoc 签名。已完成独立应用副本上的安装、恢复和实际签名校验；完整界面端到端验证范围见 CHANGELOG.md。请先保存工作并阅读下方风险。

## 一、下载哪个文件

本修正版交付文件为 `factory-zh-cn-macos-v1.0.1.zip`，附带 `SHA256SUMS.txt`。从 [v1.0.1 发布页](https://github.com/Yaci0418/factory-zh-cn-macos/releases/tag/v1.0.1-macos) 下载；[直接下载 ZIP](https://github.com/Yaci0418/factory-zh-cn-macos/releases/download/v1.0.1-macos/factory-zh-cn-macos-v1.0.1.zip)。

解压后打开 `factory-zh-cn-macos-v1.0.1` 文件夹。不要只把 `.command` 文件移出去，`dist`、`src`、`translations` 等目录需要保持原样。

## 二、安装前准备

1. 确认已安装 Factory Desktop。默认位置：`/Applications/Factory.app`。
2. 安装 [Node.js](https://nodejs.org/) 18 或更高版本。在 macOS「终端」输入 `node --version` 确认安装成功。
3. 保存 Factory 中进行的工作，按 **⌘Q 完全退出**。只关窗口不等于退出。
4. 在独立的 macOS「终端」运行补丁，不要在 Factory 内承载的终端执行。

不确定 Factory 版本时，可在 Finder 中选中 Factory.app，按 ⌘I 查看版本。

## 三、安装中文

### 方法 A：双击脚本

双击 `一键汉化.command`，阅读终端里的签名风险提示，按回车继续。脚本遇到错误会停止，不会自动关闭或启动 Factory，也不使用 launchd。

### 方法 B：终端安装（便于查看错误）

先让终端进入解压文件夹：

1. 打开 macOS「终端」。
2. 输入 `cd `，注意末尾有一个空格。
3. 把解压后的 `factory-zh-cn-macos-v1.0.1` 文件夹拖进终端，再按回车。
4. 输入下面的命令：

```bash
node dist/patcher.cjs install --lang zh --yes --no-launch
```

如果 Factory 不在默认位置，将实际的 `.app` 路径填写到 `--dir` 后：

```bash
node dist/patcher.cjs install --dir "/Applications/Factory.app" --lang zh --yes --no-launch
```

看到“汉化完成”后，**手动打开 Factory**，进入：

**Settings → Preferences → Language → 简体中文**

有些启动加载文字和产品名仍为英文，这是当前限制。

## 四、确认是否安装成功

在解压文件夹内执行：

```bash
node dist/patcher.cjs status --lang zh --no-launch
```

默认安装路径的签名校验：

```bash
codesign --verify --deep --strict "/Applications/Factory.app"
```

状态应显示“中文补丁：已安装”和“原版备份：存在”。签名校验成功通常没有输出，但这**不等于恢复了官方签名或获得官方公证**。

## 五、恢复英文

先保存工作并完全退出 Factory，再双击 `恢复英文原版.command`。也可在解压文件夹执行：

```bash
node dist/patcher.cjs restore --lang zh --yes --no-launch
```

非默认安装路径请补上对应的 `--dir "/实际路径/Factory.app"`。

恢复后手动打开应用；如果语言设置仍保留中文，可在语言设置中改为 English。

**恢复命令只恢复程序文件，随后仍用 ad-hoc 签名。要恢复官方原始签名，请重新安装官方 Factory。**

## 六、常见问题

| 提示或现象 | 怎么处理 |
| --- | --- |
| `node: command not found` | 安装 Node.js，重新打开终端，再运行 `node --version` |
| 找不到 `dist/patcher.cjs` 或词典 | 没有进入正确文件夹，或只移动了脚本；请完整解压并重新执行 `cd` |
| Factory 正在运行 | 保存工作并按 ⌘Q 退出，再重新执行命令 |
| `.command` 提示没有执行权限 | 使用上面的终端安装方法，不需要修改系统安全设置 |
| macOS 提示无法验证文件 | 先核对来源和校验值；不确定时停止，不要关闭 Gatekeeper 或 SIP |
| `EPERM` / `EACCES` / 权限不足 | 停止并记录错误，确认应用位置及当前用户的写入权限；不要盲目加 `sudo` |
| 无法定位补丁位置 / 不支持此版本 | 停止；仅对已验证构建提供支持，不要强行修改匹配逻辑 |
| 签名失败或应用打不开 | 停止；必要时重新安装官方 Factory |
| 安装成功但仍是英文 | 手动选择 Settings → Preferences → Language → 简体中文 |
| Factory 更新后汉化消失 | 更新会覆盖补丁；先确认新版本兼容性，不要直接假设能重复安装 |

提交问题前请遮盖日志中的姓名、邮箱、用户目录、账号标识和令牌。不要上传整个 Factory.app、备份或个人会话目录。

## 七、风险与备份

- 修改 `app.asar`，为主进程和渲染进程注册中文资源；同步更新 `Info.plist` 中的 ASAR 完整性哈希，不禁用该校验。
- 自动备份原版 `app.asar` 和 `Info.plist` 到应用内 `Contents/Resources/zh-cn-backup/`。
- 会替换官方代码签名，原 Developer ID、Team ID 和原有签名信任状态不再保留，部分功能或 macOS 安全机制可能受影响。
- 文件替换异常时会恢复操作前的文件对；恢复签名失败时会重新放回备份，便于重试。断电、强制终止及安装签名失败仍不保证自动回滚，必要时需重新安装官方应用。
- 本包不含 Factory 应用、个人账号数据或原版备份，不读取聊天记录；补丁自身未发现主动上传数据的逻辑。这不代表 Factory 应用本身不会联网。

## 八、验证范围

针对本机 Factory Desktop 1.3.0 独立副本：

- 首次安装、重复安装、恢复英文：通过。
- 安装和恢复后的实际 `codesign --verify --deep --strict`：通过。
- 恢复后的完整 ASAR SHA-256 与原版备份一致。
- 原有测试及故障回归测试：18 项通过，同时覆盖源码与构建产物。
- 翻译资源覆盖率：15,455 / 15,948，约 96.91%。
- 真实启动、中英文切换、设置与外观页面、原生菜单、恢复后英文主界面：通过；完整范围及限制见 CHANGELOG.md。

ZIP 不包含 `.git`，因此不包含提交作者姓名和邮箱。但是，仓库已有公开提交中的身份信息不会因下载包发布而自动消失。

## 九、开发与许可

开发步骤见 [DEVELOPING.md](DEVELOPING.md)。

基于 [Chun 的上游项目](https://github.com/Chun556699/Factory-Droid-Chinese-Language-Patch)，保留原作者版权声明，使用 MIT 许可证，见 `LICENSE`。

非官方社区项目，与 Factory / Cognition 无关。
