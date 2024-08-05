import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "热牛奶",
  description: "学习笔记",

  theme,
  markdown: {
    headers: {
      // 用到哪一级就提取哪一级
      level: [1, 2, 3],
    },
  },
  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
