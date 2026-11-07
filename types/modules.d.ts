// The tiles renderer's plugins live at a subpath that TypeScript's "node"
// module resolution can't follow, as it doesn't read package exports, so
// they're untyped
declare module "3d-tiles-renderer/plugins";
