# CLAUDE.md — Piano Theory App

## 项目概述
- 钢琴乐理学习flashcard + quiz app，给钢琴老师的学生使用（ABRSM Grade 1-5考试备考）
- 由老师的家人协助开发，老师有内容审核权，老师说的内容以她为准
- 部署在 GitHub Pages（thohui888-blip 账号），单一 HTML 文件

## 技术架构
- **单文件 HTML**：CSS + JS + 所有图片（base64嵌入）全在一个 .html 文件里
- **无框架**：纯 Vanilla JS，无 build tools，无 npm
- **数据存储**：localStorage（多用户，key格式：`pianoTheory_stats_<username>`，用户列表：`pianoTheory_users`）
- **音频**：Web Audio API（无外部文件，程序生成音效）
- **字体**：Google Fonts（Nunito），需要网络加载
- **图片来源**：pianosightreading.com.au 下载 + Gemini 生成（base64嵌入，educational use only）
- **Claude API**：无（本app不调用AI API）

## 文件结构
```
piano-theory-app.html  ← 唯一文件，所有内容都在这里
```

## 主要功能模块
1. **用户选择**：进入app先选名字，记录各自分开，支持新增/删除用户
2. **主页**：大topic入口（Terms & Signs 可用；Rhythm / Key Signature / Music Instrument 占位 coming soon）
3. **Daily Review**：每天10题，优先顺序：weak terms → 从未见过 → 最久没复习
4. **Terms & Signs**：5个categories（Musical Signs / Dynamics / Tempo / Expression / General Terms）
5. **Flashcard**：左右滑动或点按钮切换，点卡片翻面，有🔊 Play Sound按钮（articulation/dynamics）
6. **Quiz**：所有items都出题，答错放回队列重考直到全对（Duolingo风格）
7. **Weak Terms**：错2次进入，连续答对6次移出，错题本显示在categories页顶部
8. **掌握度**：连续答对3次算mastered，category页显示进度条

## 卡片类型（item.type）
- `normal`：正面显示term名称（+图片），背面显示meaning
- `imgonly`：正面只显示图片（Staccato / Accent / Fermata），背面显示名称+meaning
- `lang`：正面显示Italian/French/German三语对照表，背面显示meaning（Tempo / Expression / 部分General Terms）

## 内容规则（改动时必须遵守）
- **老师有最终审核权**，所有内容改动以老师确认为准
- **括号内容不能省略**，例如 `accelerando (accel.)` 不能只写 `accelerando`
- **意思要照书本原文**，不能自己改写
- `poco` 和 `poco a poco` 是两张分开的卡片，不合并
- `da capo (D.C.)` 没有符号图片（dal segno图片只属于 dal segno）
- `sf, sfz (sforzando, sforzato)` 合并一张
- `rf, rfz rinforzando (rinf.)` 合并一张
- Tempo/Expression的lang卡片：有些term只有部分语言对应（空白正常，不需要填）

## 已知坑 / 特殊处理
- **localStorage在Claude预览环境不工作**，必须部署到GitHub Pages才能测试用户记录功能
- **图片用base64嵌入**，所以单文件很大（约900KB），不要再塞入高分辨率图片
- **Gemini生成图片**：马来西亚Google账号生成的API key格式不兼容browser-side，只能用Gemini网页界面生成图片
- **flashcard翻转用display切换**（不用CSS 3D rotateY），因为3D方案导致backface是镜像文字而且卡片没有实际高度
- **Quiz options去重逻辑**：同topic内有重复meaning（如morendo/perdendosi/smorzando都是"dying away"），makeQuestion()会排除相同meaning的干扰项
- **音频需要用户交互才能启动**：所有playSound/playDemo调用前都有 `AC.resume && AC.resume()`
- **Netlify build minutes已用完**，目前用GitHub Pages部署

## 版本记录
- v1.x — Flashcard + quiz基础功能，图片嵌入，音效，内容按grade分类
- v2.0 — 重构：多用户，主页大topic结构，Daily Review，Weak Terms，swipe手势，记忆系统

## 待完成（Coming Soon）
- Rhythm module
- Key Signature module
- Music Instrument / Orchestra Family module