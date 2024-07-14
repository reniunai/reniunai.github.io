import { defineUserConfig } from "vuepress";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  lang: "zh-CN",
  title: "热牛奶",
  description: "学习笔记",

  theme,

  // 和 PWA 一起启用
  // shouldPrefetch: false,
});
