// Handle CSS imports
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Images
declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
