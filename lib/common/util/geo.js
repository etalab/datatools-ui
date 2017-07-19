export const getFeedsBounds = (feeds) => {
  const feedsWithBounds = feeds.filter(feed => feed.latestValidation && feed.latestValidation.bounds)
  if (feedsWithBounds.length === 0) {
    return null
  } else {
    return feedsWithBounds.reduce((bounds, currentFeed) => {
        return {
          east: currentFeed.latestValidation.bounds.east > bounds.east ? currentFeed.latestValidation.bounds.east : bounds.east,
          west: currentFeed.latestValidation.bounds.west < bounds.west ? currentFeed.latestValidation.bounds.west : bounds.west,
          north: currentFeed.latestValidation.bounds.north > bounds.north ? currentFeed.latestValidation.bounds.north : bounds.north,
          south: currentFeed.latestValidation.bounds.south < bounds.south ? currentFeed.latestValidation.bounds.south : bounds.south
    }}, feedsWithBounds[0].latestValidation.bounds)
  }
}
