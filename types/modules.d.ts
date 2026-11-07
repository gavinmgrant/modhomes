// three ships no type definitions in the version used here, and the tiles
// renderer's plugins live at a subpath TypeScript's module resolution can't
// follow, so both are untyped, like three's objects are elsewhere
declare module "three";
declare module "3d-tiles-renderer/plugins";
