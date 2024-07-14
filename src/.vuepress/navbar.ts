import { navbar } from "vuepress-theme-hope";

export default navbar([
  "/",
  // "/demo/",
  // {
  //   text: 'demo',
  //   icon: 'pen-to-square',
  //   link: '/demo/'
  // },
  {
    text: "笔记",
    icon: "pen-to-square",
    prefix: "/note/",
    children: [
      {
        text: "java",
        icon: "pen-to-square",
        link: 'java/'
      },
      {
        text: "redis",
        icon: "pen-to-square",
        link: 'redis/',
      },
      {
        text: "redis",
        icon: "pen-to-square",
        link: 'Linux/',
      },
    ],
  }
]);
