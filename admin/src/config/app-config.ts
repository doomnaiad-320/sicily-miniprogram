import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "校园失物招领",
  version: packageJson.version,
  copyright: `© ${currentYear}, 校园失物招领系统`,
  meta: {
    title: "校园失物招领 - 后台管理系统",
    description: "校园失物招领后台管理系统，基于 Next.js 16 和 Shadcn UI 构建",
  },
};
