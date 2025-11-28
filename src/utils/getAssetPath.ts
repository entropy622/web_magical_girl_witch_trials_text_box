/**
 * 获取资源路径, 去掉开头的 /. 你可能觉得有点莫名奇妙，但是这是为了兼容 vite 的路径问题
 * 比如 vite 的静态资源路径是 /static/xxx.png, 浏览器中的浏览路径是example.com/first
 * 如果在img的ref中引用 /static/xxx.png, 则在浏览器中会访问 example.com/static/xxx.png,
 * 这在使用github page部署的时候会出问题
 * 但是如果使用 static/xxx.png, 则在浏览器中会访问 example.com/first/static/xxx.png, 这是正确的
 * 有点奇妙，但是work！
 * 不过一个坏处是，项目结构只能是SPA了
 */
export const getAssetPath = (path: string) => {
  if (path.startsWith('/')) return path.slice(1);
  return path;
};
