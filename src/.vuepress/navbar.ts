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
        text: "mysql",
        icon: "pen-to-square",
        link: 'mysql/',
      },
      {
        text: "mq",
        icon: "pen-to-square",
        link: 'mq/',
      },
      {
        text: "es",
        icon: "pen-to-square",
        link: 'es/',
      },
      {
        text: "kafka",
        icon: "pen-to-square",
        link: 'kafka/',
      },
      {
        text: "linux",
        icon: "pen-to-square",
        link: 'Linux/',
      },
      {
        text: "go",
        icon: "pen-to-square",
        link: 'go/',
      },
      {
        text: "计算机网络",
        icon: "pen-to-square",
        link: 'computernetwork/',
      },
    ],
  }
]);
