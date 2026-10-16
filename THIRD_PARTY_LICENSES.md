# 第三方组件与开源许可 · Third-Party Notices

本插件（松鼠下载器 · 浏览器插件）**随包分发**了下列第三方库。
按其许可要求，此处保留版权声明、许可证标识与源码获取方式。

> **本插件自己的代码以 [MIT](./LICENSE) 许可发布**（Copyright (c) 2026 panoptes88）。
> 本文件列的是**第三方**组件，不受 MIT 约束。

---

## hls.js

用于在弹窗内预览 m3u8 流，以本地文件方式引入，**未做任何修改**。

| 项目 | 内容 |
| --- | --- |
| 文件 | `lib/hls.min.js` |
| 版本 | **1.6.16** |
| 许可证 | **Apache-2.0** |
| 版权 | Copyright (c) 2017-present Dailymotion |
| 源码 | <https://github.com/video-dev/hls.js> |
| 许可证全文 | [`licenses/Apache-2.0.txt`](./licenses/Apache-2.0.txt) |
| 修改情况 | **未修改**（官方发布的压缩版；其原始文件头部的许可声明在压缩过程中被去除，故在此处补充署名） |

Apache-2.0 要求保留版权与许可声明、随分发提供许可证副本。本仓库已通过
`licenses/Apache-2.0.txt` 提供完整许可证文本，并在本文件保留署名。

---

## 关于 NAS 端的第三方组件

插件的下载能力由 **松鼠下载器（NAS 端）** 提供，那一边另有自己的第三方组件：

| 组件 | 许可证 |
| --- | --- |
| N_m3u8DL-RE | MIT |
| FFmpeg（自建最小化构建） | LGPL-2.1-or-later |
| Bento4 `mp4decrypt` | GPL-2.0 |

它们**不随本插件分发**，相关声明见
[松鼠下载器仓库的 THIRD_PARTY_LICENSES.md](https://github.com/panoptes88/squirrel-downloader/blob/main/THIRD_PARTY_LICENSES.md)。

---

## 参考实现

本插件的嗅探实现参考了 [cat-catch](https://github.com/xifangczy/cat-catch) 的设计思路，
但**未复制其代码**。

---

*最后更新：随 1.0.0 版本一起发布。*
