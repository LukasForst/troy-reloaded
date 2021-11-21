/**
 * Returns extension of the file.
 */
export const getFileExtension = (filename: string): string => {
  const extensionMatch = filename?.match(/\.(tar\.gz|[^.]*)$/i);
  const foundExtension = extensionMatch?.[1];
  return foundExtension || '';
};
