export const formatImageUrl = (request, imagePath) => {
  if (!imagePath) return null;
  return `${request.protocol}://${request.hostname}/files${imagePath}`;
};