# Factory Desktop 简体中文补丁 · macOS

## 直接下载

**[点击下载 macOS 汉化补丁 ZIP（含完整源码和中文指南）](https://github.com/Yaci0418/factory-zh-cn-macos/releases/download/v1.0.0-macos/factory-zh-cn-macos-v1.0.0.zip)**

下载后完整解压，先打开 **`先读我.txt`**。普通用户无需安装 npm 依赖，开发者请阅读包内 **`DEVELOPING.md`**。

[查看发布说明与校验文件](https://github.com/Yaci0418/factory-zh-cn-macos/releases/tag/v1.0.0-macos)。当前为预览版，真实安装、恢复及界面端到端测试尚未完成。

Factory Desktop 汉化补丁的社区 macOS 移植版，基于 [Chun 的上游项目](https://github.com/Chun556699/Factory-Droid-Chinese-Language-Patch)。

适配目标为 **Factory Desktop 1.2.0 / macOS arm64**。本仓库不包含 Factory 应用、账号数据或原版程序备份。

## 使用

需要 Node.js 18 或更高版本，以及已安装的 Factory Desktop。

1. 点击上方的 **ZIP 直接下载链接**，完整解压后阅读 `先读我.txt`。
2. **完全退出 Factory（⌘Q）**，在独立的 macOS 终端执行命令。
3. 安装汉化：

```bash
node dist/patcher.cjs install --lang zh --yes --no-launch
```

也可双击 `一键汉化.command`。安装后不会自动启动应用。手动打开 Factory，在「Settings → Preferences → Language」选择「简体中文」。

安装路径不是默认位置时：

```bash
node dist/patcher.cjs install --dir "/Applications/Factory.app" --lang zh --yes --no-launch
```

查看状态：

```bash
node dist/patcher.cjs status --lang zh --no-launch
```

恢复英文（先完全退出 Factory）：

```bash
node dist/patcher.cjs restore --lang zh --yes --no-launch
```

也可双击 `恢复英文原版.command`。

## 工作方式与风险

- 为渲染进程和主进程生成中文资源，注册 `zh-CN` 语言。
- 更新 `Info.plist` 中的 `ElectronAsarIntegrity` 哈希，不禁用 ASAR 完整性校验。
- 原始 `app.asar` 和 `Info.plist` 备份在应用内 `Contents/Resources/zh-cn-backup/`。
- 修改应用后使用 **ad-hoc 签名**重新签名，原官方 Developer ID、Team ID 和原有签名信任状态不再保留。部分 macOS 安全机制或应用功能可能受影响。
- 恢复命令恢复上述程序文件并再次使用 ad-hoc 签名，**不会恢复官方代码签名**。如需官方原始状态，请重新安装官方应用。
- 更新 Factory 可能覆盖补丁，也可能使补丁不兼容。请勿在应用运行时安装。
- 安装和签名不是完整事务；权限不足或签名失败可能留下不可启动的应用。遇到错误请停止操作，必要时重新安装官方版本。

## 验证记录

针对本机 Factory Desktop 1.2.0 的离线检查：

| 项目 | 结果 |
| --- | --- |
| 实际主进程、渲染进程补丁位置定位 | 通过 |
| 内存中生成补丁及 JavaScript 语法检查 | 通过 |
| 构建产物与源码一致性 | 通过 |
| 词典 | 14,445 条，无空值或双花括号占位符不一致 |
| 资源覆盖率 | 15,449 / 15,696，约 98.43% |

以上为离线验证，**不代表本次已完成真实应用安装、恢复或 GUI 端到端验证**。缺失的 149 种英文文本含产品名、标识符等；覆盖率不等同于翻译质量。启动加载页等硬编码文本可能仍为英文。

## 开发

```bash
npm ci
npm test
npm run build
```

源码：`src/patcher.js`。词典：`translations/zh-CN.json`。单文件构建：`dist/patcher.cjs`。

## 许可与致谢

沿用上游 MIT 许可证，保留 `LICENSE` 中的原作者版权声明。补丁及原始词典源自上游，本项目提供 macOS 适配和扩充翻译。

非官方社区项目，与 Factory / Cognition 无关。使用前请自行评估修改应用和替换签名的风险。
