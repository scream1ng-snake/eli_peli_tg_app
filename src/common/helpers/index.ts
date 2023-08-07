export const replaceImgSrc = (newPath: any) =>
  ({ currentTarget }: React.SyntheticEvent<HTMLImageElement, Event>) => {
    currentTarget.onerror = null;
    currentTarget.src = newPath
  }