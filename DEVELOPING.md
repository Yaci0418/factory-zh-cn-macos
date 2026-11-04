# 开发者指南

本 ZIP 同时提供可运行构建和完整源码。只是安装汉化时不需要以下开发步骤，请先读 `README.md`。

## 1. 文件结构

```text
factory-zh-cn-macos-v1.0.1/
├── 先读我.txt                  # 普通用户入口
├── README.md                   # 安装、验证、恢复和风险
├── DEVELOPING.md               # 本开发指南
├── LICENSE                     # 上游 MIT 许可证
├── 一键汉化.command            # 安装包装脚本，不自动启动应用
├── 恢复英文原版.command        # 恢复包装脚本
├── package.json
├── package-lock.json
├── src/patcher.js               # 补丁源码
├── dist/patcher.cjs             # 单文件构建，可直接用 Node.js 运行
├── tests/dictionary.test.cjs    # 词典和语法测试
├── tests/recovery.test.cjs      # 参数、回滚和恢复失败重试测试
└── translations/zh-CN.json      # 英文原文 → 简体中文
```

## 2. 准备环境并运行测试

需要 Node.js 18+、npm。以下命令都在解压后的项目目录中运行：

```bash
npm ci
npm test
npm run build
```

`npm ci` 会联网安装锁文件中的开发依赖。`npm run build` 更新 `dist/patcher.cjs`，不会修改 Factory.app。

`npm test` 检查：

- 所有翻译都是非空字符串。
- `{{name}}` 等双花括号占位符保持一致。
- 源码和构建文件的 JavaScript 语法有效。

新增回归测试对 src 和 dist 分别模拟文件替换、签名、签名验证及备份删除失败，测试原生命令使用桩，不会触碰已安装应用。测试通过不代表 GUI 行为已验证。

## 3. 修改词典

编辑 `translations/zh-CN.json`。键是完整英文原文，值是中文：

```json
{
  "Settings": "设置",
  "Hello {{name}}": "你好，{{name}}"
}
```

保留原文里的占位符、必要的标记和命令。不要把日志、账号数据或真实密钥加入词典。

词典在运行时从磁盘读取，不内嵌到构建文件。仅改词典时无需重新构建；改动 `src/patcher.js` 后必须运行 `npm run build`。

## 4. 补丁执行流程

1. 定位 Factory.app、检查运行状态和 ASAR 完整性。
2. 备份原始 `app.asar` 与 `Info.plist`。
3. 解包到临时目录，用 Acorn 解析主进程、渲染进程的英文资源。
4. 根据词典生成中文资源，修改语言列表、加载器及相关资源表。
5. 重新打包，检查未改动文件的完整性。
6. 替换应用资源并更新 `Info.plist` 中的哈希。
7. 使用 macOS `codesign` 进行 ad-hoc 签名，再检查结果。

主要修改点通过内容匹配定位；不支持的构建应中止。安装、签名不是完整事务，切勿把当前实现描述为“任何错误都能自动回滚”。

## 5. 在应用副本上集成测试

建议先复制一份 Factory.app 到专用测试目录，不要直接修改正在使用的应用。替换下方示例路径为自己的副本路径，确保该副本未运行：

```bash
node dist/patcher.cjs status --dir "/path/to/test/Factory.app" --lang zh --no-launch
node dist/patcher.cjs install --dir "/path/to/test/Factory.app" --lang zh --yes --no-launch
codesign --verify --deep --strict "/path/to/test/Factory.app"
node dist/patcher.cjs status --dir "/path/to/test/Factory.app" --lang zh --no-launch
```

确认签名及状态后，如需 GUI 测试，由测试者手动打开副本。检查语言切换、设置页面、原生菜单及错误提示。不要混淆副本和原应用。

退出测试副本后检查恢复：

```bash
node dist/patcher.cjs restore --dir "/path/to/test/Factory.app" --lang zh --yes --no-launch
codesign --verify --deep --strict "/path/to/test/Factory.app"
node dist/patcher.cjs status --dir "/path/to/test/Factory.app" --lang zh --no-launch
```

恢复后也仍是 ad-hoc 签名，而不是官方签名。v1.0.1 已在 Factory 1.3.0 独立副本上完成上述安装、恢复和实际签名验证。GUI 验证范围见 CHANGELOG.md。

## 6. 导出未翻译词条

```bash
node dist/patcher.cjs report --dir "/path/to/test/Factory.app" --lang zh --no-launch
```

此命令会读取应用并写入本项目的 `translations/untranslated.json`，不是纯只读命令。输出用于补词，不要提交个人应用数据或调试日志。

## 7. 提交问题或改动前

- 写清 macOS 版本、芯片架构、Factory 版本和复现步骤。
- 遮盖个人目录、邮箱、账号 ID、密钥和会话内容。
- 不上传 `.git`、`.env`、`node_modules`、日志、Factory.app 或 `zh-cn-backup`。
- 构建后运行测试，注明哪些安装及 GUI 测试实际做过，不能把离线检查写成端到端验证。
- GitHub 的提交作者和邮箱会公开，请在自己电脑上确认 Git 身份及 GitHub 隐私邮箱设置。
- 保留上游 MIT 许可证与署名。
