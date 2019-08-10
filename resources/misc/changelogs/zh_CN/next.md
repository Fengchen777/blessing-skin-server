## 新增

- 插件系统：`config.blade.php` 为默认情况下配置视图文件名
- 支持以 `php artisan plugin:enable {name}` 的方式开启插件
- 支持以 `php artisan plugin:disable {name}` 的方式关闭插件

## 调整

- 修改 GuzzleHttp 库获取 CA 证书的策略
- 重构用户系统
- PHP 版本最低要求为 7.2.12

## 修复

- 管理面板的列表中某些字段不应是可排序的
- 补充部分缺失的语言文本
- 重置皮肤预览后，皮肤模型也被重置的问题

## 移除

- 移除 Artisan 命令：`php artisan key:random`
- 移除为 v3 迁移到 v4 而编写的 Artisan 命令
- 放弃对 IIS 的支持